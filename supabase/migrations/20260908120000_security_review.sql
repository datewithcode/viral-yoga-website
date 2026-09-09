-- Security review fixes (docs/security-review-2026-09-08.md).
--
-- F02: webhook deliveries that failed for a transient reason are retried by
--      Razorpay with the same event id; count the attempts.
-- F03: enquiry rate limits are enforced inside one database function. The
--      per-phone and per-address limits each take a lock, so parallel requests
--      from one phone or one address cannot all pass. The overall limit of 100
--      takes no lock and can overshoot under a burst; it is a circuit breaker,
--      not a precise cap.

alter table public.webhook_events add column if not exists attempts integer not null default 0;

alter table public.enquiries add column if not exists ip text;
create index if not exists enquiries_ip_created_idx on public.enquiries (ip, created_at desc);

-- Check the limits and insert in one transaction. Returns {"ok":true,"id":n}
-- or {"ok":false,"reason":"phone"|"ip"|"global"}.
-- Only the submit-enquiry function (service_role) may call this.
create or replace function public.submit_enquiry(
  p_name text, p_phone text, p_email text, p_studio text, p_interest text, p_message text, p_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - interval '10 minutes';
  new_id bigint;
begin
  -- Serialise checks per phone and per IP for this transaction.
  perform pg_advisory_xact_lock(hashtext('enquiry:phone:' || p_phone));
  if p_ip is not null then
    perform pg_advisory_xact_lock(hashtext('enquiry:ip:' || p_ip));
  end if;

  if (select count(*) from public.enquiries where phone = p_phone and created_at >= since) >= 3 then
    return jsonb_build_object('ok', false, 'reason', 'phone');
  end if;
  if p_ip is not null
     and (select count(*) from public.enquiries where ip = p_ip and created_at >= since) >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'ip');
  end if;
  -- Circuit breaker only: a bot rotating numbers and addresses must not fill
  -- the admin page. Legitimate traffic never comes close.
  if (select count(*) from public.enquiries where created_at >= since) >= 100 then
    return jsonb_build_object('ok', false, 'reason', 'global');
  end if;

  insert into public.enquiries (name, phone, email, studio, interest, message, ip)
  values (p_name, p_phone, p_email, p_studio, p_interest, p_message, p_ip)
  returning id into new_id;

  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

revoke all on function public.submit_enquiry(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_enquiry(text, text, text, text, text, text, text) to service_role;
