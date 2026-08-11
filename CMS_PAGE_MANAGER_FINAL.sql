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
