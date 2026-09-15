-- Dragg-TR: make Terms acceptance a server-controlled one-way transition.
-- Authenticated clients may still update encrypted profile PII, but cannot
-- toggle the acceptance flag directly.

revoke update on table public.profiles from authenticated;
grant update (email, name) on table public.profiles to authenticated;

create or replace function public.accept_terms()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set terms_accepted = true
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.accept_terms() from public;
revoke all on function public.accept_terms() from anon;
grant execute on function public.accept_terms() to authenticated;
