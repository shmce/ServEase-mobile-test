create extension if not exists pgcrypto;

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  street_address varchar null,
  city varchar null,
  province varchar null,
  zip_code varchar null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_addresses
  alter column id set default gen_random_uuid();

alter table public.user_addresses
  alter column user_id set not null;

create index if not exists user_addresses_user_id_idx
  on public.user_addresses (user_id, created_at desc);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_addresses_updated_at on public.user_addresses;
create trigger set_user_addresses_updated_at
before update on public.user_addresses
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.user_addresses enable row level security;

drop policy if exists "users can read own addresses" on public.user_addresses;
create policy "users can read own addresses"
on public.user_addresses
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own addresses" on public.user_addresses;
create policy "users can insert own addresses"
on public.user_addresses
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own addresses" on public.user_addresses;
create policy "users can update own addresses"
on public.user_addresses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own addresses" on public.user_addresses;
create policy "users can delete own addresses"
on public.user_addresses
for delete
using (auth.uid() = user_id);
