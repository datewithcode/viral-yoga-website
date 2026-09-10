-- Third review round: the manual paths around payments.
--
-- 1. A membership sold at the desk cannot be saved twice by a double tap: one
--    member, one plan, one start date is one row. Online rows are excluded;
--    they are already unique by payment id, and a second unique index on them
--    would let recordPayment mistake a real payment for a duplicate.
-- 2. The owner can clear the "payments that need attention" list. Only that
--    one column, only for staff.
-- 3. A start date that is not given defaults to today in India, not UTC.
--    Every current path sets it explicitly; this removes the trap.

create unique index if not exists memberships_desk_once_idx
  on public.memberships (member_id, plan, starts_on)
  where source in ('cash', 'upi');

-- Revoke first: a table-level update grant (which local stacks hand out by
-- default) would let staff change any column, and revoking it also clears
-- any column grants, so the one column is granted afterwards.
revoke update on public.webhook_events from authenticated;
grant update (needs_attention) on public.webhook_events to authenticated;

create policy webhook_events_staff_update on public.webhook_events
  for update to authenticated
  using      (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'staff');

alter table public.memberships
  alter column starts_on set default (now() at time zone 'Asia/Kolkata')::date;
