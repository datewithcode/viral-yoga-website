-- Second review round. Two problems, both created by the retry fix earlier today.
--
-- 1. The admin "payments that need attention" list could not tell a permanent
--    failure from a retry still in flight, so the owner could enter a payment
--    by hand seconds before the retry recorded it, giving one payment two
--    memberships. `needs_attention` now says which is which, and only the
--    owner's list reads it.
--
-- 2. create-order had no limit before it looked a phone number up, so a
--    signed-in user could probe numbers all day to learn who is a member.
--    Every attempt is now counted per user, before anything is looked up.

alter table public.webhook_events
  add column if not exists needs_attention boolean not null default false;

-- Everything already sitting unprocessed with an error was, under the old code,
-- always a permanent failure: the old webhook answered 200 and never retried.
update public.webhook_events
   set needs_attention = true
 where processed = false and error is not null;

create index if not exists webhook_events_attention_idx
  on public.webhook_events (needs_attention, received_at desc)
  where needs_attention;

-- One row per create-order call, so probing can be bounded per signed-in user.
-- Rows are disposable; nothing reads them except the rate limit.
create table if not exists public.order_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  created_at  timestamptz not null default now()
);

create index if not exists order_attempts_user_created_idx
  on public.order_attempts (user_id, created_at desc);

alter table public.order_attempts enable row level security;
-- No policy and no grant: only the Edge Function (service_role) touches this.
revoke all on public.order_attempts from anon, authenticated;
