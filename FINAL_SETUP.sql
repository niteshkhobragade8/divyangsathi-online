
-- =========================================================
-- DIVYANGSATHI FINAL SETUP (IDEMPOTENT)
-- Run in Supabase SQL Editor AFTER taking a database backup.
-- =========================================================
create extension if not exists pgcrypto;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'general',
  title text not null,
  message text,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx on public.admin_notifications(created_at desc);

create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 2 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reviewer_id,profile_id),
  check (reviewer_id <> profile_id)
);
alter table public.profile_reviews enable row level security;
drop policy if exists "reviews public approved read" on public.profile_reviews;
create policy "reviews public approved read" on public.profile_reviews for select using (status='approved' or reviewer_id=auth.uid());
drop policy if exists "reviews authenticated insert" on public.profile_reviews;
create policy "reviews authenticated insert" on public.profile_reviews for insert to authenticated with check (reviewer_id=auth.uid());
drop policy if exists "reviews owner update pending" on public.profile_reviews;
create policy "reviews owner update pending" on public.profile_reviews for update to authenticated using (reviewer_id=auth.uid()) with check (reviewer_id=auth.uid());

-- Generic helper; SECURITY DEFINER keeps trigger inserts reliable.
create or replace function public.ds_admin_notify(p_type text,p_title text,p_message text,p_ref uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.admin_notifications(type,title,message,reference_id)
  values(p_type,p_title,p_message,p_ref);
end;$$;

create or replace function public.ds_notify_new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.ds_admin_notify('new_user','New User Registration',coalesce(new.full_name,'A new member')||' registered on DivyangSathi.',new.id);
  return new;
end;$$;
drop trigger if exists ds_trg_new_profile on public.profiles;
create trigger ds_trg_new_profile after insert on public.profiles for each row execute function public.ds_notify_new_profile();

create or replace function public.ds_notify_new_interest() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.ds_admin_notify('new_interest','New Interest','A new matrimonial interest was sent.',new.id);
  return new;
end;$$;
drop trigger if exists ds_trg_new_interest on public.interests;
create trigger ds_trg_new_interest after insert on public.interests for each row execute function public.ds_notify_new_interest();

create or replace function public.ds_notify_new_membership() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.ds_admin_notify('new_payment','New Payment / UTR','New '||coalesce(new.plan,'membership')||' request · ₹'||coalesce(new.amount,0)::text||' · UTR '||coalesce(new.utr_number,'-'),new.id);
  return new;
end;$$;
drop trigger if exists ds_trg_new_membership on public.memberships;
create trigger ds_trg_new_membership after insert on public.memberships for each row execute function public.ds_notify_new_membership();

create or replace function public.ds_notify_new_report() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.ds_admin_notify('new_report','New User Report','A new user report requires admin review.',new.id);
  return new;
end;$$;
drop trigger if exists ds_trg_new_report on public.user_reports;
create trigger ds_trg_new_report after insert on public.user_reports for each row execute function public.ds_notify_new_report();

-- Recommended admin RLS: adapt to your existing admins table policies if already stricter.
alter table public.admin_notifications enable row level security;
drop policy if exists "active admins read admin notifications" on public.admin_notifications;
create policy "active admins read admin notifications" on public.admin_notifications for select to authenticated using (exists(select 1 from public.admins a where a.id=auth.uid() and a.active=true));
drop policy if exists "active admins update admin notifications" on public.admin_notifications;
create policy "active admins update admin notifications" on public.admin_notifications for update to authenticated using (exists(select 1 from public.admins a where a.id=auth.uid() and a.active=true));

-- Admin review moderation can be done in SQL or a later admin UI. Example:
-- update public.profile_reviews set status='approved' where id='...';


-- =========================================================
-- MATCH PERCENTAGE RPC
-- Rule-based compatibility scoring. The UI may call this "Match %";
-- it is deterministic and explainable, not a black-box ML model.
-- =========================================================
create or replace function public.get_recommended_matches(match_limit integer default 20)
returns table(
  id uuid,
  full_name text,
  profile_photo text,
  age integer,
  gender text,
  state text,
  disability_type text,
  membership_plan text,
  verified boolean,
  match_score integer
)
language sql
security invoker
set search_path=public
as $$
with me as (
  select * from public.profiles where profiles.id=auth.uid() limit 1
)
select
  p.id,
  p.full_name::text,
  p.profile_photo::text,
  p.age::integer,
  p.gender::text,
  p.state::text,
  p.disability_type::text,
  coalesce(p.membership_plan::text,'Free') as membership_plan,
  coalesce(p.verified,false) as verified,
  least(100,
    35
    + case when me.preferred_state is not null and me.preferred_state<>'' and lower(coalesce(p.state,''))=lower(me.preferred_state) then 20 else 0 end
    + case when me.preferred_disability is not null and me.preferred_disability<>'' and lower(coalesce(p.disability_type,''))=lower(me.preferred_disability) then 15 else 0 end
    + case when me.religion is not null and me.religion<>'' and lower(coalesce(p.religion,''))=lower(me.religion) then 10 else 0 end
    + case when coalesce(p.verified,false) then 10 else 0 end
    + case when coalesce(p.premium,false) then 5 else 0 end
    + case when me.gender is not null and p.gender is not null and lower(p.gender)<>lower(me.gender) then 5 else 0 end
  )::integer as match_score
from public.profiles p cross join me
where p.id<>auth.uid()
  and coalesce(p.blocked,false)=false
  and coalesce(p.account_status,'active') not in ('deactivated','deletion_requested')
order by match_score desc, p.created_at desc
limit greatest(1,least(coalesce(match_limit,20),100));
$$;
-- DivyangSathi dynamic Website/Admin page manager
create table if not exists public.cms_pages(
 id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
 content text default '', status text default 'published' check(status in('draft','published')),
 is_visible boolean default true, sort_order int default 0, show_in_menu boolean default false,
 menu_label text, menu_icon text, created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create table if not exists public.admin_cms_pages(
 id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
 content text default '', status text default 'published' check(status in('draft','published')),
 is_visible boolean default true, sort_order int default 0, show_in_menu boolean default true,
 menu_label text, menu_icon text, created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
alter table public.cms_pages enable row level security;
alter table public.admin_cms_pages enable row level security;
drop policy if exists cms_pages_admin_all on public.cms_pages;
create policy cms_pages_admin_all on public.cms_pages for all to authenticated using(public.is_active_admin()) with check(public.is_active_admin());
drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_public_read on public.cms_pages for select to anon,authenticated using(deleted_at is null and status='published' and is_visible=true);
drop policy if exists admin_cms_pages_admin_all on public.admin_cms_pages;
create policy admin_cms_pages_admin_all on public.admin_cms_pages for all to authenticated using(public.is_active_admin()) with check(public.is_active_admin());
