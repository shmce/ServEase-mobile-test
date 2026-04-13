-- Task 1: Migrate provider_catalog_svc.provider_services
-- Adds dual pricing capabilities to the catalog service.

alter table provider_catalog_svc.provider_services
  add column if not exists supports_hourly boolean not null default true,
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists supports_flat boolean not null default false,
  add column if not exists flat_rate numeric(10,2),
  add column if not exists default_pricing_mode text;

-- Data Migration: Use legacy 'price' as default for 'hourly_rate'
update provider_catalog_svc.provider_services
set hourly_rate = coalesce(hourly_rate, price)
where hourly_rate is null;

-- Data Migration: Set default pricing mode
update provider_catalog_svc.provider_services
set default_pricing_mode = coalesce(default_pricing_mode, 'hourly')
where default_pricing_mode is null;

-- Constraints for provider_catalog_svc.provider_services
alter table provider_catalog_svc.provider_services
  drop constraint if exists provider_services_default_pricing_mode_check,
  add constraint provider_services_default_pricing_mode_check
  check (default_pricing_mode is null or default_pricing_mode in ('hourly', 'flat')),
  
  drop constraint if exists provider_services_supported_pricing_check,
  add constraint provider_services_supported_pricing_check
  check (supports_hourly or supports_flat),
  
  drop constraint if exists provider_services_hourly_rate_check,
  add constraint provider_services_hourly_rate_check
  check ((not supports_hourly) or (hourly_rate is not null and hourly_rate > 0)),
  
  drop constraint if exists provider_services_flat_rate_check,
  add constraint provider_services_flat_rate_check
  check ((not supports_flat) or (flat_rate is not null and flat_rate > 0));


-- Task 2: Migrate booking_svc.bookings
-- Adds snapshots for pricing mode and flat rates to the booking service.

alter table booking_svc.bookings
  add column if not exists pricing_mode text,
  add column if not exists flat_rate numeric(10,2);

-- Data Migration: Set legacy bookings to 'hourly'
update booking_svc.bookings
set pricing_mode = coalesce(pricing_mode, 'hourly')
where pricing_mode is null;

alter table booking_svc.bookings
  alter column pricing_mode set not null;

-- Constraints for booking_svc.bookings
alter table booking_svc.bookings
  drop constraint if exists bookings_pricing_mode_check,
  add constraint bookings_pricing_mode_check
  check (pricing_mode in ('hourly', 'flat'));
