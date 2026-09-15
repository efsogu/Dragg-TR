-- Supabase can assign explicit anon EXECUTE ACLs to public functions.
-- `REVOKE ... FROM PUBLIC` alone does not remove an explicit anon grant.
revoke execute on function public.calculate_total_saved(date) from anon;
revoke execute on function public.add_goal_funds(uuid, uuid, numeric) from anon;

revoke execute on function public.calculate_total_saved(date) from public;
revoke execute on function public.add_goal_funds(uuid, uuid, numeric) from public;

grant execute on function public.calculate_total_saved(date) to authenticated;
grant execute on function public.add_goal_funds(uuid, uuid, numeric) to authenticated;
