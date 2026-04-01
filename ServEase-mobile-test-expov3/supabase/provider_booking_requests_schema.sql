create table if not exists public.booking_reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  explanation text not null,
  proposed_date date not null,
  proposed_time text not null,
  status text not null default 'pending',
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.booking_reschedule_requests add column if not exists reviewed_at timestamptz null;
alter table public.booking_reschedule_requests add column if not exists reviewed_by uuid null references public.users(id) on delete set null;

create index if not exists booking_reschedule_requests_booking_id_idx
  on public.booking_reschedule_requests (booking_id, created_at desc);

create table if not exists public.additional_charges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.users(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null default 0,
  justification text,
  status text not null default 'pending',
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.additional_charges add column if not exists reviewed_at timestamptz null;
alter table public.additional_charges add column if not exists reviewed_by uuid null references public.users(id) on delete set null;

create index if not exists additional_charges_booking_id_idx
  on public.additional_charges (booking_id, created_at desc);
