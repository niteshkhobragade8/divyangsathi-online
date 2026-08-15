-- DivyangSathi CMS / Admin CMS administrator recovery
-- Run ONCE in Supabase SQL Editor if Website CMS/Admin CMS says:
--   Access Denied: active administrator account required.
-- Safe to run again: it upserts the existing administrator row.

begin;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and a.active = true
  );
$$;

grant execute on function public.is_active_admin() to authenticated;

-- Restore the administrator record from Supabase Auth if it was accidentally deleted.
-- This targets the administrator email currently used by this DivyangSathi project.
do $$
declare
  v_id uuid;
  v_email text := 'niteshkhobragade8@gmail.com';
begin
  select id into v_id
  from auth.users
  where lower(email) = lower(v_email)
  order by created_at asc
  limit 1;

  if v_id is null then
    raise exception 'Auth user % not found. Log in/create the admin Auth user first.', v_email;
  end if;

  insert into public.admins (id, email, full_name, active)
  values (v_id, v_email, 'Nitesh Atmaram Khobragade', true)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.admins.full_name, excluded.full_name),
        active = true;
end $$;

-- Allow an authenticated administrator to read its own admin row.
-- Existing stricter policies are preserved; this only adds the missing self-read path.
alter table public.admins enable row level security;
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read
on public.admins
for select
to authenticated
using (id = auth.uid());

commit;

-- Verification (run after the transaction):
-- select id,email,full_name,active from public.admins
-- where lower(email)=lower('niteshkhobragade8@gmail.com');
