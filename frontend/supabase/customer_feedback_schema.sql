create table if not exists public.provider_profile_reports (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.users(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete set null,
  reason text not null,
  details text null,
  status text not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_profile_reports_provider_id_idx
  on public.provider_profile_reports (provider_id, created_at desc);

create index if not exists provider_profile_reports_reporter_id_idx
  on public.provider_profile_reports (reporter_id, created_at desc);

create unique index if not exists reviews_booking_reviewer_unique_idx
  on public.reviews (booking_id, reviewer_id);
