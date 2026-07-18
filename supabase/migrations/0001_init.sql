-- Hồ sơ chuyển mục đích sử dụng đất - xã Tân Thới
-- Schema khởi tạo: bảng ho_so, custom_field_defs, settings + RLS

create extension if not exists pgcrypto;

create table if not exists public.ho_so (
  id uuid primary key default gen_random_uuid(),
  stt integer,
  ho_ten text,
  dia_chi_noi_o text,
  ap text,
  dia_chi_thua_dat text,
  to_ban_do text,
  thua_dat_truoc text,
  loai_dat_truoc text,
  dien_tich_truoc numeric,
  thua_dat_sau text,
  dien_tich_sau_cln numeric,
  dien_tich_sau_ont numeric,
  dien_tich_sau_nts numeric,
  ngay_nhan date,
  ngay_tra date,
  ghi_chu text,
  gcn_so_seri text,
  gcn_so_giay text,
  so_dien_thoai text,
  nam integer not null,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ho_so_nam_idx on public.ho_so (nam);
create index if not exists ho_so_ap_idx on public.ho_so (ap);
create index if not exists ho_so_loai_dat_truoc_idx on public.ho_so (loai_dat_truoc);
create index if not exists ho_so_ngay_nhan_idx on public.ho_so (ngay_nhan);

create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'date')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  overdue_days integer not null default 20
);
insert into public.settings (id, overdue_days) values (1, 20)
  on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ho_so_set_updated_at on public.ho_so;
create trigger ho_so_set_updated_at
  before update on public.ho_so
  for each row execute function public.set_updated_at();

alter table public.ho_so enable row level security;
alter table public.custom_field_defs enable row level security;
alter table public.settings enable row level security;

create policy "authenticated read ho_so" on public.ho_so
  for select to authenticated using (true);
create policy "authenticated insert ho_so" on public.ho_so
  for insert to authenticated with check (true);
create policy "authenticated update ho_so" on public.ho_so
  for update to authenticated using (true) with check (true);
create policy "authenticated delete ho_so" on public.ho_so
  for delete to authenticated using (true);

create policy "authenticated read custom_field_defs" on public.custom_field_defs
  for select to authenticated using (true);
create policy "authenticated insert custom_field_defs" on public.custom_field_defs
  for insert to authenticated with check (true);
create policy "authenticated update custom_field_defs" on public.custom_field_defs
  for update to authenticated using (true) with check (true);
create policy "authenticated delete custom_field_defs" on public.custom_field_defs
  for delete to authenticated using (true);

create policy "authenticated read settings" on public.settings
  for select to authenticated using (true);
create policy "authenticated update settings" on public.settings
  for update to authenticated using (true) with check (true);
