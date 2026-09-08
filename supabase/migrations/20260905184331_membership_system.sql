-- Membership system: members, memberships, reminders, webhook log.
-- See docs/superpowers/specs/2026-09-06-membership-system-design.md

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.members (
  id          bigint generated always as identity primary key,
  name        text not null default '',
  -- Digits only, with country code, e.g. 919876543210. Normalised by trigger.
  phone       text not null unique,
  -- Lower-cased by trigger. Used to match the student login.
  email       text unique,
  notes       text not null default '',
  -- Set when the member has signed in online. The trusted link for the student page.
  user_id     uuid unique references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint members_phone_digits check (phone ~ '^[0-9]{10,15}$'),
  constraint members_email_lower check (email is null or email = lower(email))
);

create table public.memberships (
  id                   bigint generated always as identity primary key,
  member_id            bigint not null references public.members (id) on delete cascade,
  plan                 text not null,
  amount_paise         integer not null,
  starts_on            date not null default current_date,
  -- Filled by trigger from plan + starts_on when omitted (NOT NULL is checked after BEFORE triggers).
  ends_on              date not null,
  source               text not null,
  razorpay_payment_id  text unique,
  razorpay_order_id    text,
  created_at           timestamptz not null default now(),
  constraint memberships_plan_check   check (plan in ('1 month', '3 months', '6 months', '1 year')),
  constraint memberships_amount_check check (amount_paise >= 0),
  constraint memberships_source_check check (source in ('razorpay', 'upi', 'cash')),
  constraint memberships_dates_check  check (ends_on > starts_on)
);

create index memberships_member_id_idx on public.memberships (member_id);
create index memberships_ends_on_idx   on public.memberships (ends_on);

create table public.reminders (
  id             bigint generated always as identity primary key,
  membership_id  bigint not null references public.memberships (id) on delete cascade,
  channel        text not null default 'whatsapp',
  sent_at        timestamptz not null default now(),
  constraint reminders_channel_check check (channel in ('whatsapp'))
);

create index reminders_membership_id_idx on public.reminders (membership_id);

-- Orders we created for a signed-in student, before they paid. Both the
-- webhook and verify-payment trust this row (not the payment payload) to know
-- which member and plan a payment belongs to.
create table public.payment_orders (
  id                 bigint generated always as identity primary key,
  razorpay_order_id  text not null unique,
  member_id          bigint not null references public.members (id) on delete cascade,
  plan               text not null,
  amount_paise       integer not null,
  status             text not null default 'created',
  created_at         timestamptz not null default now(),
  constraint payment_orders_plan_check   check (plan in ('1 month', '3 months', '6 months', '1 year')),
  constraint payment_orders_amount_check check (amount_paise > 0),
  constraint payment_orders_status_check check (status in ('created', 'paid'))
);

create index payment_orders_member_id_idx on public.payment_orders (member_id);

-- Trial-class enquiries from the website contact form. Inserted only by the
-- submit-enquiry function; staff read and close them from the admin page.
create table public.enquiries (
  id          bigint generated always as identity primary key,
  name        text not null,
  phone       text not null,
  email       text,
  studio      text not null default '',
  interest    text not null default '',
  message     text not null default '',
  status      text not null default 'new',
  created_at  timestamptz not null default now(),
  constraint enquiries_status_check check (status in ('new', 'done'))
);

create index enquiries_status_created_idx on public.enquiries (status, created_at desc);
create index enquiries_phone_created_idx  on public.enquiries (phone, created_at desc);

-- Raw log of every webhook call, so a payment is never lost even if matching fails.
create table public.webhook_events (
  id           bigint generated always as identity primary key,
  provider     text not null default 'razorpay',
  event        text not null,
  event_id     text unique,
  payload      jsonb not null,
  processed    boolean not null default false,
  error        text,
  received_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Calendar-month arithmetic: 1 month from 15 Jan is 15 Feb.
create or replace function public.plan_end_date(starts date, plan text)
returns date
language sql
immutable
set search_path = ''
as $$
  select (
    starts + case plan
      when '1 month'  then interval '1 month'
      when '3 months' then interval '3 months'
      when '6 months' then interval '6 months'
      when '1 year'   then interval '1 year'
    end
  )::date;
$$;

create or replace function public.members_normalise()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.phone := regexp_replace(coalesce(new.phone, ''), '[^0-9]', '', 'g');
  -- Indian 10-digit numbers get the country code.
  if length(new.phone) = 10 then
    new.phone := '91' || new.phone;
  end if;
  new.email := nullif(lower(trim(new.email)), '');
  new.name  := trim(coalesce(new.name, ''));
  return new;
end;
$$;

create trigger members_normalise
  before insert or update on public.members
  for each row execute function public.members_normalise();

create or replace function public.memberships_fill_end_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ends_on is null then
    new.ends_on := public.plan_end_date(new.starts_on, new.plan);
  end if;
  return new;
end;
$$;

create trigger memberships_fill_end_date
  before insert on public.memberships
  for each row execute function public.memberships_fill_end_date();

-- ---------------------------------------------------------------------------
-- Grants. New projects do not expose tables automatically; grant explicitly.
-- anon gets nothing. Students and staff are both `authenticated`; RLS separates them.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.members, public.memberships, public.reminders to authenticated;
grant select on public.webhook_events to authenticated;
grant select on public.payment_orders to authenticated;
grant select, update on public.enquiries to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on function public.plan_end_date(date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Staff = JWT app_metadata.role = 'staff' (set by SQL on the owner user; never user_metadata).
-- Student = authenticated user whose email matches members.email.
-- ---------------------------------------------------------------------------

alter table public.members        enable row level security;
alter table public.memberships    enable row level security;
alter table public.reminders      enable row level security;
alter table public.webhook_events enable row level security;
alter table public.payment_orders  enable row level security;
alter table public.enquiries       enable row level security;

create policy members_staff_all on public.members
  for all to authenticated
  using      (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

create policy members_student_select on public.members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (email is not null and email = lower((select auth.jwt() ->> 'email')))
  );

create policy memberships_staff_all on public.memberships
  for all to authenticated
  using      (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

create policy memberships_student_select on public.memberships
  for select to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and (
          m.user_id = (select auth.uid())
          or (m.email is not null and m.email = lower((select auth.jwt() ->> 'email')))
        )
    )
  );

create policy reminders_staff_all on public.reminders
  for all to authenticated
  using      (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

create policy payment_orders_staff_select on public.payment_orders
  for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

create policy payment_orders_student_select on public.payment_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.id = payment_orders.member_id and m.user_id = (select auth.uid())
    )
  );

create policy enquiries_staff_all on public.enquiries
  for all to authenticated
  using      (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

create policy webhook_events_staff_select on public.webhook_events
  for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');
