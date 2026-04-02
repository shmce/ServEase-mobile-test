create table if not exists public.provider_verification (
  user_id uuid primary key references public.users(id) on delete cascade,
  government_id_type text,
  government_id_number text,
  nbi_clearance_number text,
  prc_license_number text,
  business_permit_number text,
  tin_number text,
  proof_of_address_notes text,
  service_areas text[] default '{}',
  languages text[] default '{}',
  years_experience text,
  portfolio_summary text,
  reference_contacts text,
  has_insurance boolean not null default false,
  verification_status text not null default 'draft',
  verification_level text not null default 'unverified',
  verification_score integer not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_verification_status_idx
  on public.provider_verification (verification_status);

create or replace function public.set_provider_verification_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists provider_verification_set_updated_at on public.provider_verification;
create trigger provider_verification_set_updated_at
before update on public.provider_verification
for each row execute function public.set_provider_verification_updated_at();
