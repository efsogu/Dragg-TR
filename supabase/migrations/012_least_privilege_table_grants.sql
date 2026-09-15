-- Dragg-TR hardening: align authenticated grants with actual RLS policies.
revoke all on table public.profiles from authenticated;
revoke all on table public.categories from authenticated;
revoke all on table public.payment_methods from authenticated;
revoke all on table public.transactions from authenticated;
revoke all on table public.monthly_budgets from authenticated;
revoke all on table public.goals from authenticated;
revoke all on table public.privacy_requests from authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.categories from anon;
revoke all on table public.payment_methods from anon;
revoke all on table public.transactions from anon;
revoke all on table public.monthly_budgets from anon;
revoke all on table public.goals from anon;
revoke all on table public.privacy_requests from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.payment_methods to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.monthly_budgets to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update on table public.privacy_requests to authenticated;
