-- Projects created with "Automatically expose new tables" off give service_role
-- no data privileges. Edge Functions use service_role (supabaseAdmin), so grant
-- them explicitly, now and for future tables. Also strip the odd defaults that
-- gave anon TRUNCATE/REFERENCES/TRIGGER. Idempotent; harmless on local stacks.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

revoke truncate, references, trigger on all tables in schema public from anon, authenticated, service_role;
