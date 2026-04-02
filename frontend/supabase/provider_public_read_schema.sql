alter table public.users enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_services enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "authenticated users can read provider user basics" on public.users;
create policy "authenticated users can read provider user basics"
on public.users
for select
to authenticated
using (
  exists (
    select 1
    from public.provider_profiles p
    where p.user_id = users.id
  )
  or exists (
    select 1
    from public.provider_services s
    where s.provider_id = users.id
  )
);

drop policy if exists "authenticated users can read provider profiles" on public.provider_profiles;
create policy "authenticated users can read provider profiles"
on public.provider_profiles
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read provider services" on public.provider_services;
create policy "authenticated users can read provider services"
on public.provider_services
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read reviews" on public.reviews;
create policy "authenticated users can read reviews"
on public.reviews
for select
to authenticated
using (true);
