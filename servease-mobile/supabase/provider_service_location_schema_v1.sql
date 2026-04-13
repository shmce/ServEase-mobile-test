-- Adds service-level location settings for provider services.
-- Primary target: provider_catalog_svc.provider_services.

alter table provider_catalog_svc.provider_services
  add column if not exists service_location_type text not null default 'mobile',
  add column if not exists service_location_address text;

alter table provider_catalog_svc.provider_services
  drop constraint if exists provider_services_service_location_type_check,
  add constraint provider_services_service_location_type_check
  check (service_location_type in ('mobile', 'in_shop')),
  drop constraint if exists provider_services_service_location_address_required_check,
  add constraint provider_services_service_location_address_required_check
  check (
    service_location_type = 'mobile'
    or (
      service_location_type = 'in_shop'
      and nullif(btrim(service_location_address), '') is not null
    )
  );

-- If this needs to run against a pre-microservice local database, use this instead:
-- alter table public.provider_services
--   add column if not exists service_location_type text not null default 'mobile',
--   add column if not exists service_location_address text;
--
-- alter table public.provider_services
--   drop constraint if exists provider_services_service_location_type_check,
--   add constraint provider_services_service_location_type_check
--   check (service_location_type in ('mobile', 'in_shop')),
--   drop constraint if exists provider_services_service_location_address_required_check,
--   add constraint provider_services_service_location_address_required_check
--   check (
--     service_location_type = 'mobile'
--     or (
--       service_location_type = 'in_shop'
--       and nullif(btrim(service_location_address), '') is not null
--     )
--   );
