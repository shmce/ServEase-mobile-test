# Spec: Fix Provider Discovery — Redundant Navigation & Unnamed Providers

**Date:** 2026-04-05  
**Author:** Claude (spec owner)  
**Status:** Ready for implementation

---

## Goal

Fix two compounding bugs in the provider discovery flow that make it impossible for a customer to reach a provider's profile with correct data:

1. A redundant navigation hop when tapping a subcategory
2. A data-shape mismatch that causes all providers to show as "Unnamed provider" and routes to the wrong profile

---

## Context / Root Cause Analysis

### Current navigation flow (broken)

```
Home
 └─ CategoryGrid tap "Home Maintenance & Repair"
     └─ category-details?title=Home Maintenance & Repair
         (shows subcategory grid: Plumbing, Electrical…)
         └─ tap "Electrical"
             └─ category-details?title=Electrical          ← REDUNDANT same screen
                 (calls getServicesByCategoryName("Electrical"))
                 └─ tap a service row
                     └─ provider-list?serviceName=<service.title>
                         └─ tap a provider card             ← shows "Unnamed provider"
                             └─ provider-profile?providerId=<WRONG ID>
                                 └─ data not loading → "Service Provider" fallback
```

---

## Bug 1 — Redundant Navigation Hop

**Location:** `frontend/app/category-details.tsx:147–150`

```typescript
onPress={() =>
  router.push({
    pathname: '/category-details',    // ← navigates back to itself
    params: { title: subcategory },
  })
}
```

When a user taps a subcategory (e.g., "Electrical") from the top-level category page, the code pushes to another `category-details` screen. The second screen then calls the backend to load services under that subcategory name. This creates two identically-titled screens in the stack and confuses users who expected to see providers.

**Fix:** Subcategory cards should navigate directly to `/provider-list?serviceName=<subcategory>`, bypassing the intermediate service-listing step. The `getProvidersByServiceName` backend already supports matching by service name with `ilike`.

```typescript
// BEFORE
pathname: '/category-details',
params: { title: subcategory },

// AFTER
pathname: '/provider-list',
params: { serviceName: subcategory },
```

---

## Bug 2 — Data Shape Mismatch: Unnamed Providers & Wrong `providerId`

### 2a — Wrong response shape from backend

**Location:** `backend/src/modules/services/services.service.ts:158–174`

`getProvidersByServiceName` returns **`provider_services` rows** with `provider_profiles` embedded as a nested object:

```json
{
  "id": "<service_row_uuid>",
  "title": "Electrical Wiring",
  "price": 500,
  "provider_profiles": {
    "user_id": "<actual_provider_user_id>",
    "business_name": "Santos Electric",
    "average_rating": 4.8,
    "verification_status": "approved"
  }
}
```

### 2b — Frontend type mismatch

**Location:** `frontend/services/marketplaceService.ts:12`

```typescript
export type ProviderCard = {
  id: string;          // frontend expects the PROVIDER's user id
  name: string;        // frontend expects the provider's full name
  businessName: string;
  rating: number;
  reviews: number;
  priceLabel: string;
};
```

The frontend reads `provider.id` (service row UUID, not the provider's user ID), `provider.name` (undefined), `provider.businessName` (undefined). This causes:

- All cards render "Unnamed provider"
- The navigation to `/provider-profile` passes the **service row UUID** as `providerId`
- `getProviderProfileData(providerId)` queries `users.id = <service_uuid>` → returns null → profile shows "Service Provider" with all fields empty

**Location of wrong ID being passed:** `frontend/app/provider-list.tsx:82–88`

```typescript
router.push({
  pathname: '/provider-profile',
  params: {
    providerId: provider.id,   // ← this is the service row ID, not provider user ID
    serviceName,
    providerName: provider.name,  // ← undefined
  },
})
```

### Fix

**Option A (preferred): Transform in the backend** — `getProvidersByServiceName` should join with `identity_svc.users` to get `full_name` and return a shaped `ProviderCard[]`:

```typescript
return {
  service_name: serviceName,
  providers: response.data.map(row => ({
    id: row.provider_profiles?.user_id,           // provider's actual user_id
    name: row.provider_full_name || '',           // from users join
    businessName: row.provider_profiles?.business_name || '',
    rating: Number(row.provider_profiles?.average_rating || 0),
    reviews: 0,                                   // no review count in current query
    priceLabel: row.price ? `P${Number(row.price).toFixed(2)}` : '',
  }))
};
```

This requires adding a join to `identity_svc.users` via `identityDb` in the backend service, or using `provider_profiles` with a separate query for `full_name`.

**Option B (simpler, no backend change): Transform on frontend** in `marketplaceService.ts`:

```typescript
export const getProvidersByServiceName = async (serviceName: string): Promise<ProviderCard[]> => {
  const { providers } = await api.get<{ providers: any[] }>(`/services/providers/${encodeURIComponent(serviceName)}`);
  return (providers || []).map(row => ({
    id: row.provider_profiles?.user_id || row.id,
    name: row.provider_profiles?.business_name || 'Unknown Provider',
    businessName: row.provider_profiles?.business_name || '',
    rating: Number(row.provider_profiles?.average_rating || 0),
    reviews: 0,
    priceLabel: row.price ? `P${Number(row.price).toFixed(2)}` : '',
  }));
};
```

Option B is lower risk (no backend change, no new join). It uses `business_name` as the display name since `full_name` is not yet returned. Recommended for now. Backend can be enhanced later to also return `full_name` from the users table.

---

## Scope

| File | Change |
|---|---|
| `frontend/app/category-details.tsx` | Subcategory press → `/provider-list` instead of `/category-details` |
| `frontend/services/marketplaceService.ts` | Map raw service rows to `ProviderCard` shape with correct `id` and name fields |

## Non-goals

- Changing the provider profile screen layout
- Fetching provider `full_name` from the backend (business name is sufficient for now)
- Adding reviews count to provider cards (no data available without additional query)
- Changing the top-level category grid
- Adding search or filtering on the provider list

---

## Files Affected

| File | Lines | Change |
|---|---|---|
| `frontend/app/category-details.tsx` | 147–150 | Change `pathname` and `params` for subcategory press |
| `frontend/services/marketplaceService.ts` | 24–27 | Map response rows to `ProviderCard` shape |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Subcategory → provider-list bypasses service-level grouping if a subcategory has many different services | Low | `provider-list` already renders all matching providers; users can still filter by the service they need |
| `provider_profiles` may be `null` for unverified providers in the response | Low | The filter `.eq('provider_profiles.verification_status', 'approved')` should exclude them; add null-safe access in the map |
| `user_id` from `provider_profiles` being null for edge case rows | Low | Fall back to `row.id` with a warning; those providers won't load correctly until data is fixed |

---

## Acceptance Criteria

1. Tapping a subcategory (e.g., "Electrical") from the category page navigates directly to the provider list, not to another category-details screen.
2. Providers on the list display their `business_name` (not "Unnamed provider" or "Service Provider").
3. Tapping a provider card navigates to `provider-profile` with the correct `providerId` (the provider's `user_id`), and the profile screen loads real data.
4. Back navigation from provider-list returns to the category page correctly (not to a dead intermediate screen).
5. Providers with `null` business name fall back gracefully (e.g., "Provider" — not "Unnamed provider").

---

## Verification Plan

1. Run the existing `__tests__/provider-list.test.tsx` — should still pass.
2. Manual flow: Home → tap "Home Maintenance & Repair" → tap "Electrical" → confirm goes to provider list, not another category page.
3. Manual flow: tap a provider card → confirm profile screen shows a real name and loads services/reviews.
4. Check the network response for `/services/providers/Electrical` (or any subcategory name) — confirm `provider_profiles.user_id` is present on each row.
