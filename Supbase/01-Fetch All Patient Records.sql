-- CareFlow — Step 1:
alter table public.users enable row level security;

drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Admins can view all users" on public.users;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create policy "Users can view their own profile"
on public.users
for select
to authenticated
using (id = (select auth.uid()));

create policy "Admins can view all users"
on public.users
for select
to authenticated
using ((select public.is_admin()));
