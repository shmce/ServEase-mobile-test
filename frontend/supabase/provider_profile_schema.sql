alter table provider_catalog_svc.provider_services add column if not exists supports_hourly boolean not null default true;
alter table provider_catalog_svc.provider_services add column if not exists hourly_rate numeric(10,2);
alter table provider_catalog_svc.provider_services add column if not exists supports_flat boolean not null default false;
alter table provider_catalog_svc.provider_services add column if not exists flat_rate numeric(10,2);
alter table provider_catalog_svc.provider_services add column if not exists default_pricing_mode text;
alter table booking_svc.bookings add column if not exists pricing_mode text;
alter table booking_svc.bookings add column if not exists flat_rate numeric(10,2);
