create extension if not exists pgcrypto;

-- Ensure identity_svc schema exists (should already exist if users table is there)
-- CREATE SCHEMA IF NOT EXISTS identity_svc;

create table if not exists identity_svc.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references identity_svc.users(id) on delete cascade,
  label varchar null, -- e.g. Home, Work, Other
  street_address varchar null,
  barangay varchar null,
  city varchar null,
  province varchar null,
  zip_code varchar null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indices
create index if not exists user_addresses_user_id_idx
  on identity_svc.user_addresses (user_id, created_at desc);

-- Trigger for updated_at
create or replace function identity_svc.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_addresses_updated_at on identity_svc.user_addresses;
create trigger set_user_addresses_updated_at
before update on identity_svc.user_addresses
for each row
execute function identity_svc.set_current_timestamp_updated_at();

-- RLS Policies
alter table identity_svc.user_addresses enable row level security;

drop policy if exists "users can read own addresses" on identity_svc.user_addresses;
create policy "users can read own addresses"
on identity_svc.user_addresses
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own addresses" on identity_svc.user_addresses;
create policy "users can insert own addresses"
on identity_svc.user_addresses
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own addresses" on identity_svc.user_addresses;
create policy "users can update own addresses"
on identity_svc.user_addresses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own addresses" on identity_svc.user_addresses;
create policy "users can delete own addresses"
on identity_svc.user_addresses
for delete
using (auth.uid() = user_id);
