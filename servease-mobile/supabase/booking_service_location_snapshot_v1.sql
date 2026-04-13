-- Adds a service location type snapshot onto bookings so details screens
-- can keep showing the original mobile vs in-shop context after services change.

alter table booking_svc.bookings
  add column if not exists service_location_type text not null default 'mobile';

alter table booking_svc.bookings
  drop constraint if exists bookings_service_location_type_check,
  add constraint bookings_service_location_type_check
  check (service_location_type in ('mobile', 'in_shop'));

-- If this needs to run against a pre-microservice local database, use this instead:
-- alter table public.bookings
--   add column if not exists service_location_type text not null default 'mobile';
--
-- alter table public.bookings
--   drop constraint if exists bookings_service_location_type_check,
--   add constraint bookings_service_location_type_check
--   check (service_location_type in ('mobile', 'in_shop'));
