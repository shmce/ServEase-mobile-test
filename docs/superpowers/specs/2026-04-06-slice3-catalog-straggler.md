# Slice 3 Straggler — Catalog Direct Query Migration

**Date:** 2026-04-06  
**Status:** Approved  
**Risk:** Low

---

## Goal

Remove the one remaining direct Supabase query in `customer-booking-form.tsx` that bypasses the API. The backend already has a `/provider/my-services` endpoint family — the booking form just needs to call it through the API client instead of querying `providerCatalogDb` directly.

---

## Root Cause

`mobile/app/customer-booking-form.tsx` — `loadServiceOptions` effect (around line 864) calls:

```ts
providerCatalogDb
  .from('provider_services')
  .select('id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
  .eq('provider_id', params.providerId)
```

This bypasses the backend entirely. The backend already has `GET /services/providers/:serviceName` and `GET /provider/my-services` but neither returns the per-provider service list by providerId in the shape the booking form needs.

---

## Scope

- `backend/src/modules/services/services.controller.ts` + `services.service.ts` — add `GET /services/provider/:providerId/services`
- `mobile/app/customer-booking-form.tsx` — replace `providerCatalogDb` query with API call
- `mobile/app/customer-booking-form.tsx` — add `service_location_type` + `service_location_address` to the select (ties in with the provider-photo-and-service-location spec)

---

## Non-goals

- No changes to pricing screen
- No changes to any other booking-related screen

---

## Backend Change

### New endpoint

```
GET /services/provider/:providerId/services
```

**Auth:** Public (same as existing `/services/providers/:serviceName` — no guard needed, customers view before booking)

**Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "title": "string",
      "price": 0,
      "supports_hourly": true,
      "hourly_rate": 0,
      "supports_flat": false,
      "flat_rate": null,
      "default_pricing_mode": "hourly",
      "service_location_type": "mobile",
      "service_location_address": null
    }
  ]
}
```

**Service layer:** Query `provider_catalog_svc.provider_services` (or `public.provider_services`) filtered by `provider_id`, ordered by `title ASC`. Return empty array if no rows found.

---

## Mobile Change

### `customer-booking-form.tsx`

Replace the `loadServiceOptions` effect body:

**Before:**
```ts
let query = providerCatalogDb
  .from('provider_services')
  .select('id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
  .order('title', { ascending: true });

if (params.providerId) {
  query = query.eq('provider_id', params.providerId);
}

const { data, error } = await query;
if (error) throw error;
```

**After:**
```ts
const { services } = await api.get<{ services: any[] }>(
  `/services/provider/${params.providerId}/services`
);
const data = services;
```

Update `mapServiceRow` to also map `service_location_type` and `service_location_address`:
```ts
const mapServiceRow = (row: any): ServiceOption => ({
  // ...existing fields...
  service_location_type: (row.service_location_type as 'mobile' | 'in_shop') || 'mobile',
  service_location_address: row.service_location_address ?? null,
});
```

Remove the `providerCatalogDb` import from the file once this is the only usage.

---

## Acceptance Criteria

1. Booking form loads provider services via API — no direct `providerCatalogDb` call remains in the file
2. Service options display correctly for both mobile and in-shop services
3. `providerCatalogDb` import is removed from `customer-booking-form.tsx` if it was the only usage
4. Behavior is identical to before for customers

---

## Verification

1. Open booking form for a provider — confirm services load
2. Check network tab — confirm request goes to `/services/provider/:id/services`
3. Grep: `rg "providerCatalogDb" mobile/app/customer-booking-form.tsx` returns no hits
