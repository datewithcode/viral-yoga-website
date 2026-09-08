-- rls_auto_enable() is created by Supabase's "Enable automatic RLS" project
-- option. It runs as SECURITY DEFINER and must not be callable through the API.
-- Guarded: the function does not exist on local stacks.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
