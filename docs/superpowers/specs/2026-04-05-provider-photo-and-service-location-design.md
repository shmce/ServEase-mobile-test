# Provider Photo on Booking Form & Service Location Type

**Date:** 2026-04-05  
**Status:** Approved

---

## Goal

1. Show the provider's profile photo in the customer booking form's provider banner.
2. Allow providers to mark a service as "in-shop" (customer comes to provider) instead of the default "mobile" (provider goes to customer), with the address set per-service in the Pricing screen.

---

## Scope

- `frontend/app/provider-profile.tsx` — pass `avatarUrl` param when navigating to booking form
- `frontend/app/customer-booking-form.tsx` — display avatar in banner; conditionally swap address selector for read-only provider address card
- `frontend/app/(provider-tabs)/pricing.tsx` — add location type toggle and address field to service create/edit form
- Supabase `provider_services` table — add `service_location_type` and `service_location_address` columns

---

## Non-goals

- Provider profile page does not need to display the location type
- No push notification or booking summary changes
- No changes to the backend API — address is passed as `service_address` string as today
- No changes to other booking-related screens (details, cancel, reschedule)

---

## Files / Areas Affected

| File | Change |
|---|---|
| `frontend/app/provider-profile.tsx` | Add `avatarUrl` to params pushed to `/customer-booking-form` |
| `frontend/app/customer-booking-form.tsx` | Read `avatarUrl` param; update banner; update `ServiceOption` type and select query; conditional address logic |
| `frontend/app/(provider-tabs)/pricing.tsx` | Add `service_location_type` + `service_location_address` to `ServiceRow`, form state, and save payload |
| Supabase DB | `ALTER TABLE provider_catalog_svc.provider_services` (or `public.provider_services`) to add two columns |

---

## Data Layer

Two new columns on `provider_services`:

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `service_location_type` | `text` | `'mobile'` | No | `'mobile'` or `'in_shop'` |
| `service_location_address` | `text` | `null` | Yes | Only populated when `service_location_type = 'in_shop'` |

Migration SQL (run in Supabase SQL Editor):
```sql
ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS service_location_type text NOT NULL DEFAULT 'mobile',
  ADD COLUMN IF NOT EXISTS service_location_address text;
```

If the microservice migration has already run, target `provider_catalog_svc.provider_services` instead.

---

## Feature 1: Provider Photo in Booking Form Banner

### provider-profile.tsx

In the "Book Now" button handler (~line 269), add `avatarUrl` to the push params:

```ts
router.push({
  pathname: '/customer-booking-form',
  params: {
    providerId,
    providerName: providerDisplayName,
    serviceId,
    serviceName,
    avatarUrl: payload?.profile?.avatar_url ?? '',
  },
})
```

### customer-booking-form.tsx

- Add `avatarUrl?: string` to `useLocalSearchParams` destructure
- In the provider banner (lines 1141–1146), replace the `Ionicons person-circle-outline` with:
  - An `Image` component (source `{ uri: params.avatarUrl }`) if `params.avatarUrl` is non-empty
  - Fallback to `Ionicons person-circle-outline` if empty/missing
- Avatar image: 36×36, borderRadius 18, marginRight 8

---

## Feature 2: Service Location Type

### pricing.tsx (provider service form)

**Type update:**
```ts
type ServiceRow = {
  // ...existing fields...
  service_location_type: 'mobile' | 'in_shop';
  service_location_address: string | null;
};
```

**New form state:**
```ts
const [serviceLocationType, setServiceLocationType] = useState<'mobile' | 'in_shop'>('mobile');
const [serviceLocationAddress, setServiceLocationAddress] = useState('');
```

**UI — added below existing pricing fields:**
- Location type toggle: two pill buttons "Mobile" and "In-Shop"
- Service address `TextInput`: shown only when `serviceLocationType === 'in_shop'`

**Validation before save:**
- If `serviceLocationType === 'in_shop'` and `serviceLocationAddress.trim()` is empty → show Alert, block save

**Save payload additions:**
```ts
service_location_type: serviceLocationType,
service_location_address: serviceLocationType === 'in_shop' ? serviceLocationAddress.trim() : null,
```

**Edit prefill:** when opening an existing service for editing, populate `serviceLocationType` and `serviceLocationAddress` from the loaded row.

---

### customer-booking-form.tsx (address logic)

**Type update:**
```ts
type ServiceOption = {
  // ...existing fields...
  service_location_type: 'mobile' | 'in_shop';
  service_location_address: string | null;
};
```

**Select query update** in `loadServiceOptions`:
```ts
.select('id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address')
```

**Address section conditional rendering:**

When `selectedService?.service_location_type === 'in_shop'`:
- Replace the address selector with a read-only info card:
  - Label: "Service Location (Provider's Place)"
  - Shows `selectedService.service_location_address`
  - Note below: "This service is performed at the provider's location. You will need to go there."

When `mobile` or null (existing behavior):
- Render existing address selector unchanged

**validateBooking update:**
- If `in_shop`: skip the `!address` check; instead verify `selectedService.service_location_address` is non-empty
- If `in_shop`: use `selectedService.service_location_address` as `service_address` in the booking payload

---

## Risks

- `avatar_url` may be `null` for most providers in the current dataset — the fallback icon handles this gracefully
- The new DB columns default to `'mobile'`/`null`, so all existing services are unaffected without a data backfill
- If the schema migration to `provider_catalog_svc` runs before this feature lands, the ALTER TABLE target needs updating

---

## Acceptance Criteria

1. Booking form banner shows provider photo when `avatar_url` is set; shows icon fallback when not
2. Provider can toggle location type on a service; address field appears/disappears correctly
3. Saving an in-shop service without an address is blocked with an alert
4. Customer booking form shows read-only provider address card for in-shop services
5. Customer booking form shows normal address selector for mobile services
6. Booking payload uses the correct address in both cases
7. Existing bookings and services are unaffected (mobile default)

---

## Verification Plan

1. Create a new service as provider, set to "In-Shop", enter address, save — confirm DB row has correct values
2. Edit that service — confirm fields prefill correctly
3. As customer, open booking form for that service — confirm read-only address card appears with correct address
4. As customer, open booking form for a mobile service — confirm normal address selector appears
5. Confirm booking submission uses `service_location_address` as `service_address` for in-shop bookings
6. Test with a provider that has no `avatar_url` — confirm icon fallback renders without crash
7. Test with a provider that has `avatar_url` — confirm image renders in banner
