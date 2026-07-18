-- Phan quyen: admin / editor / viewer

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- security definer de tranh de quy RLS khi cac policy khac kiem tra role
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "read own or admin reads all" on public.profiles;
create policy "read own or admin reads all" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "admin updates roles" on public.profiles;
create policy "admin updates roles" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "admin deletes profiles" on public.profiles;
create policy "admin deletes profiles" on public.profiles
  for delete to authenticated
  using (public.current_user_role() = 'admin');

-- Khong co insert policy cho authenticated: tao tai khoan chi qua API
-- route dung service role key (xem src/app/api/users/route.ts).

-- ho_so: viewer chi doc, editor/admin moi duoc ghi
drop policy if exists "authenticated insert ho_so" on public.ho_so;
create policy "editor insert ho_so" on public.ho_so
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "authenticated update ho_so" on public.ho_so;
create policy "editor update ho_so" on public.ho_so
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "authenticated delete ho_so" on public.ho_so;
create policy "editor delete ho_so" on public.ho_so
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- custom_field_defs: tuong tu
drop policy if exists "authenticated insert custom_field_defs" on public.custom_field_defs;
create policy "editor insert custom_field_defs" on public.custom_field_defs
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "authenticated update custom_field_defs" on public.custom_field_defs;
create policy "editor update custom_field_defs" on public.custom_field_defs
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "authenticated delete custom_field_defs" on public.custom_field_defs;
create policy "editor delete custom_field_defs" on public.custom_field_defs
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'editor'));

-- settings: chi admin duoc sua
drop policy if exists "authenticated update settings" on public.settings;
create policy "admin update settings" on public.settings
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Gan quyen admin cho (cac) tai khoan da co san truoc khi co he thong phan quyen
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users
on conflict (id) do update set role = 'admin';
