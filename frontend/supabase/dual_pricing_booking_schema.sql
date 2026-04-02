-- Task 1 verification instructions
-- Run this query before applying the migration to confirm the pricing columns
-- are not all present yet:
--
-- select
--   column_name
-- from information_schema.columns
-- where table_schema in ('public', 'provider_catalog_svc', 'booking_svc')
--   and table_name in ('provider_services', 'bookings')
--   and column_name in (
--     'supports_hourly',
--     'hourly_rate',
--     'supports_flat',
--     'flat_rate',
--     'default_pricing_mode',
--     'pricing_mode'
--   )
-- order by table_name, column_name;
--
-- Expected before migration: missing some or all of the requested columns.
-- Expected after migration: all requested columns exist.

alter table public.provider_services
  add column if not exists supports_hourly boolean not null default true,
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists supports_flat boolean not null default false,
  add column if not exists flat_rate numeric(10,2),
  add column if not exists default_pricing_mode text;

update public.provider_services
set hourly_rate = coalesce(hourly_rate, price)
where hourly_rate is null;

update public.provider_services
set default_pricing_mode = coalesce(default_pricing_mode, 'hourly')
where default_pricing_mode is null;

alter table public.provider_services
  add constraint provider_services_default_pricing_mode_check
  check (
    default_pricing_mode is null
    or default_pricing_mode in ('hourly', 'flat')
  );

alter table public.provider_services
  add constraint provider_services_supported_pricing_check
  check (supports_hourly or supports_flat);

alter table public.provider_services
  add constraint provider_services_hourly_rate_check
  check (
    (not supports_hourly)
    or (hourly_rate is not null and hourly_rate > 0)
  );

alter table public.provider_services
  add constraint provider_services_flat_rate_check
  check (
    (not supports_flat)
    or (flat_rate is not null and flat_rate > 0)
  );

alter table public.bookings
  add column if not exists pricing_mode text,
  add column if not exists flat_rate numeric(10,2);

update public.bookings
set pricing_mode = coalesce(pricing_mode, 'hourly')
where pricing_mode is null;

alter table public.bookings
  alter column pricing_mode set not null;

alter table public.bookings
  add constraint bookings_pricing_mode_check
  check (pricing_mode in ('hourly', 'flat'));
