-- Payments and memberships removed, 11 September 2026. The website is now a
-- public site with a price list and a contact form: fees are paid at the
-- studio, and nothing about members is kept here. The earlier version is on
-- branch main_backup_payment and tag backup-2026-09-11.
--
-- Left in place: enquiries, submit_enquiry(), and the grants and lock-downs of
-- the earlier migrations. On the live project the payment tables were empty
-- and the member tables held one test member when this was written.

drop table if exists public.payment_orders;
drop table if exists public.webhook_events;
drop table if exists public.order_attempts;
drop table if exists public.reminders;
drop table if exists public.memberships;
drop table if exists public.members;

-- Only the member tables used these; their triggers went with the tables.
drop function if exists public.plan_end_date(date, text);
drop function if exists public.members_normalise();
drop function if exists public.memberships_fill_end_date();
