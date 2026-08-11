-- DIVYANGSATHI WEBSITE CMS - run once in Supabase SQL Editor
create extension if not exists pgcrypto;
create or replace function public.is_active_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admins where id=auth.uid() and active=true); $$;
create table if not exists public.cms_page_overrides(id uuid primary key default gen_random_uuid(),page_slug text not null,selector text not null,property text not null default 'text',value text,status text not null default 'draft' check(status in('draft','published')),sort_order int not null default 0,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_menu_items(id uuid primary key default gen_random_uuid(),location text not null default 'header',label text not null,url text not null,icon text,sort_order int default 0,is_visible boolean default true,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_theme(id uuid primary key default gen_random_uuid(),name text not null,settings jsonb not null default '{}'::jsonb,is_active boolean default false,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_seo(id uuid primary key default gen_random_uuid(),page_slug text not null unique,title text,description text,keywords text,canonical_url text,og_image_url text,robots text default 'index,follow',created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_notifications(id uuid primary key default gen_random_uuid(),title text not null,message text not null,image_url text,button_text text,button_url text,priority int default 0,status text default 'draft' check(status in('draft','published')),starts_at timestamptz default now(),ends_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_media(id uuid primary key default gen_random_uuid(),name text not null,type text default 'image',url text not null,alt_text text,category text,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_services(id uuid primary key default gen_random_uuid(),type text default 'service',name text not null,description text,image_url text,sort_order int default 0,is_active boolean default true,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_documents(id uuid primary key default gen_random_uuid(),title text not null,category text,url text not null,status text default 'draft',created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
create table if not exists public.cms_settings(id uuid primary key default gen_random_uuid(),key text not null unique,value jsonb not null default '{}'::jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),deleted_at timestamptz);
-- RLS: public can read only live content; active admins can manage all CMS records.
do $$ declare t text; begin foreach t in array array['cms_page_overrides','cms_menu_items','cms_theme','cms_seo','cms_notifications','cms_media','cms_services','cms_documents','cms_settings'] loop execute format('alter table public.%I enable row level security',t); execute format('drop policy if exists cms_admin_all on public.%I',t); execute format('create policy cms_admin_all on public.%I for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin())',t); end loop; end $$;
drop policy if exists cms_public_pages on public.cms_page_overrides; create policy cms_public_pages on public.cms_page_overrides for select to anon,authenticated using(deleted_at is null and status='published');
drop policy if exists cms_public_theme on public.cms_theme; create policy cms_public_theme on public.cms_theme for select to anon,authenticated using(deleted_at is null and is_active=true);
drop policy if exists cms_public_notifications on public.cms_notifications; create policy cms_public_notifications on public.cms_notifications for select to anon,authenticated using(deleted_at is null and status='published' and starts_at<=now() and (ends_at is null or ends_at>=now()));
drop policy if exists cms_public_menu on public.cms_menu_items; create policy cms_public_menu on public.cms_menu_items for select to anon,authenticated using(deleted_at is null and is_visible=true);
drop policy if exists cms_public_seo on public.cms_seo; create policy cms_public_seo on public.cms_seo for select to anon,authenticated using(deleted_at is null);
drop policy if exists cms_public_services on public.cms_services; create policy cms_public_services on public.cms_services for select to anon,authenticated using(deleted_at is null and is_active=true);
drop policy if exists cms_public_documents on public.cms_documents; create policy cms_public_documents on public.cms_documents for select to anon,authenticated using(deleted_at is null and status='published');
create or replace view public.cms_trash_view as select 'cms_page_overrides'::text source_table,id,(page_slug||' · '||selector)::text label,deleted_at from public.cms_page_overrides where deleted_at is not null union all select 'cms_menu_items',id,label,deleted_at from public.cms_menu_items where deleted_at is not null union all select 'cms_notifications',id,title,deleted_at from public.cms_notifications where deleted_at is not null union all select 'cms_media',id,name,deleted_at from public.cms_media where deleted_at is not null union all select 'cms_services',id,name,deleted_at from public.cms_services where deleted_at is not null union all select 'cms_documents',id,title,deleted_at from public.cms_documents where deleted_at is not null union all select 'cms_seo',id,page_slug,deleted_at from public.cms_seo where deleted_at is not null;
grant select on public.cms_trash_view to authenticated;
-- ============================================================
-- DIVYANGSATHI FULL CMS V2 UPGRADE
-- Run ONCE after CMS_SETUP.sql (safe/idempotent).
-- Adds direct uploads, professional notifications, analytics,
-- revision history and missing public settings access.
-- ============================================================

create extension if not exists pgcrypto;

-- Notification v2 fields
alter table public.cms_notifications add column if not exists popup_type text default 'popup';
alter table public.cms_notifications add column if not exists logo_url text;
alter table public.cms_notifications add column if not exists page_slug text default 'all';
alter table public.cms_notifications add column if not exists target_scope text default 'all';

-- Keep values constrained without breaking previous rows.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='cms_notifications_popup_type_check') then
    alter table public.cms_notifications add constraint cms_notifications_popup_type_check check (popup_type in ('normal','banner','popup','fullpage')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='cms_notifications_target_scope_check') then
    alter table public.cms_notifications add constraint cms_notifications_target_scope_check check (target_scope in ('all','guest','logged_in')) not valid;
  end if;
end $$;

-- CMS events / analytics
create table if not exists public.cms_events(
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  page_slug text,
  reference_id uuid,
  session_key text,
  created_at timestamptz default now()
);
alter table public.cms_events enable row level security;
drop policy if exists cms_events_public_insert on public.cms_events;
create policy cms_events_public_insert on public.cms_events for insert to anon,authenticated with check (event_type in ('page_view','notification_view','notification_click'));
drop policy if exists cms_events_admin_read on public.cms_events;
create policy cms_events_admin_read on public.cms_events for select to authenticated using (public.is_active_admin());

-- Revision history (automatic snapshots before CMS updates)
create table if not exists public.cms_revisions(
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  action text not null default 'update',
  snapshot jsonb not null,
  changed_by uuid default auth.uid(),
  created_at timestamptz default now()
);
alter table public.cms_revisions enable row level security;
drop policy if exists cms_revisions_admin_all on public.cms_revisions;
create policy cms_revisions_admin_all on public.cms_revisions for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin());

create or replace function public.cms_capture_revision() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if public.is_active_admin() then
    insert into public.cms_revisions(source_table,source_id,action,snapshot,changed_by)
    values (tg_table_name,old.id,'update',to_jsonb(old),auth.uid());
  end if;
  return new;
end $$;

do $$ declare t text; trig text; begin
  foreach t in array array['cms_page_overrides','cms_menu_items','cms_theme','cms_seo','cms_notifications','cms_media','cms_services','cms_documents','cms_settings'] loop
    trig := 'cms_revision_'||t;
    execute format('drop trigger if exists %I on public.%I',trig,t);
    execute format('create trigger %I before update on public.%I for each row execute function public.cms_capture_revision()',trig,t);
  end loop;
end $$;

create or replace function public.cms_restore_revision(p_revision_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare r public.cms_revisions%rowtype; allowed boolean; rec_id uuid;
begin
  if not public.is_active_admin() then raise exception 'Admin access required'; end if;
  select * into r from public.cms_revisions where id=p_revision_id;
  if not found then raise exception 'Revision not found'; end if;
  allowed := r.source_table = any(array['cms_page_overrides','cms_menu_items','cms_theme','cms_seo','cms_notifications','cms_media','cms_services','cms_documents','cms_settings']);
  if not allowed then raise exception 'Invalid CMS table'; end if;
  rec_id := (r.snapshot->>'id')::uuid;
  execute format('delete from public.%I where id=$1',r.source_table) using rec_id;
  execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I,$1)',r.source_table,r.source_table) using r.snapshot;
end $$;
grant execute on function public.cms_restore_revision(uuid) to authenticated;

-- Public website must be able to read global settings.
drop policy if exists cms_public_settings on public.cms_settings;
create policy cms_public_settings on public.cms_settings for select to anon,authenticated using (deleted_at is null);

-- Direct upload Storage bucket.
insert into storage.buckets(id,name,public,file_size_limit)
values ('cms-media','cms-media',true,52428800)
on conflict (id) do update set public=true,file_size_limit=52428800;

drop policy if exists cms_media_public_read on storage.objects;
create policy cms_media_public_read on storage.objects for select to anon,authenticated using (bucket_id='cms-media');
drop policy if exists cms_media_admin_insert on storage.objects;
create policy cms_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='cms-media' and public.is_active_admin());
drop policy if exists cms_media_admin_update on storage.objects;
create policy cms_media_admin_update on storage.objects for update to authenticated using (bucket_id='cms-media' and public.is_active_admin()) with check (bucket_id='cms-media' and public.is_active_admin());
drop policy if exists cms_media_admin_delete on storage.objects;
create policy cms_media_admin_delete on storage.objects for delete to authenticated using (bucket_id='cms-media' and public.is_active_admin());

-- Rebuild trash view, including Theme.
create or replace view public.cms_trash_view as
select 'cms_page_overrides'::text source_table,id,(page_slug||' · '||selector)::text label,deleted_at from public.cms_page_overrides where deleted_at is not null
union all select 'cms_menu_items',id,label,deleted_at from public.cms_menu_items where deleted_at is not null
union all select 'cms_theme',id,name,deleted_at from public.cms_theme where deleted_at is not null
union all select 'cms_notifications',id,title,deleted_at from public.cms_notifications where deleted_at is not null
union all select 'cms_media',id,name,deleted_at from public.cms_media where deleted_at is not null
union all select 'cms_services',id,name,deleted_at from public.cms_services where deleted_at is not null
union all select 'cms_documents',id,title,deleted_at from public.cms_documents where deleted_at is not null
union all select 'cms_seo',id,page_slug,deleted_at from public.cms_seo where deleted_at is not null;
grant select on public.cms_trash_view to authenticated;

-- Helpful indexes
create index if not exists cms_events_created_idx on public.cms_events(created_at desc);
create index if not exists cms_events_type_idx on public.cms_events(event_type);
create index if not exists cms_notifications_live_idx on public.cms_notifications(status,starts_at,ends_at);
create index if not exists cms_page_overrides_page_idx on public.cms_page_overrides(page_slug,status,sort_order);

select 'DivyangSathi CMS V2 upgrade successful' as result;
