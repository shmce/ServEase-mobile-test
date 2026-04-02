alter table public.bookings add column if not exists customer_notes text;
alter table public.bookings add column if not exists cancellation_reason text;
alter table public.bookings add column if not exists cancellation_explanation text;
alter table public.bookings add column if not exists cancelled_at timestamptz;
alter table public.bookings add column if not exists cancelled_by uuid references public.users(id) on delete set null;

create table if not exists public.provider_availability (
  user_id uuid not null references public.users(id) on delete cascade,
  day_of_week text not null,
  is_active boolean not null default true,
  start_time time,
  end_time time,
  break_start_time time,
  break_end_time time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, day_of_week)
);

create table if not exists public.provider_days_off (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  off_date date not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_days_off_user_id_idx
  on public.provider_days_off (user_id, off_date);

create table if not exists public.booking_attachments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  file_url text not null,
  file_name text,
  storage_path text,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists booking_attachments_booking_id_idx
  on public.booking_attachments (booking_id, created_at);

insert into storage.buckets (id, name, public)
values ('booking-attachments', 'booking-attachments', true)
on conflict (id) do nothing;

drop policy if exists "authenticated users can upload booking attachments" on storage.objects;
create policy "authenticated users can upload booking attachments"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'booking-attachments');

drop policy if exists "authenticated users can read booking attachments" on storage.objects;
create policy "authenticated users can read booking attachments"
on storage.objects
for select
to authenticated
using (bucket_id = 'booking-attachments');
