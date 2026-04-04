# Review: Provider Discovery Fix

**Date:** 2026-04-05  
**Reviewer:** Gemini (Adversarial Reviewer)  
**Status:** ✅ APPROVED WITH NOTES

---

## Summary of Changes

This review covers the fix for two critical bugs in the provider discovery flow:
1. **Redundant navigation hop** in `category-details.tsx`.
2. **"Unnamed Provider" / Wrong `providerId`** caused by data shape mismatch in `marketplaceService.ts`.

Additionally, the implementation included a refactor of `PricingMode` constants from `flat_rate`/`hourly_rate` to `flat`/`hourly`.

---

## Findings

### 1. Correctness against Spec
- **Bug 1 (Navigation):** Subcategory grid and service list items now correctly push directly to `/provider-list` with `serviceName`. This successfully bypasses the redundant intermediate screen.
- **Bug 2 (Data Mapping):** `marketplaceService.ts` now uses `mapProviderRowToCard` to correctly extract `user_id` as the unique `id` for navigation and `business_name` for display. This resolves the profile-loading failure and naming issue.

### 2. Pricing Mode Consistency (Critical)
> [!IMPORTANT]
> The change from `flat_rate` to `flat` in `database.interfaces.ts` was initially flagged as a regression risk. However, cross-referencing with `frontend/supabase/dual_pricing_booking_schema_v2.sql` confirms that the database constraints **strictly require** the values `'hourly'` or `'flat'`. 
> 
> **Conclusion:** This change is a necessary correction that aligns the frontend with the backend schema.

### 3. Edge Cases & Risks
- **`user_id` Fallback:** In `mapProviderRowToCard`, if `provider_profiles.user_id` is missing, it falls back to `row.id` (the service UUID). 
    - *Risk:* Tapping this card will still lead to a broken profile page (since `getProviderProfileData` queries by user ID).
    - *Recommendation:* While better than "Unnamed", we should add a console warning or sentry log when this fallback is triggered to identify data integrity issues.
- **Hardcoded Currency:** `priceLabel` hardcoded to use the `P` (Peso) prefix. If the app expands to other regions, this will need to be moved to a localization utility.

---

## Verification Results

| Test Item | Result | Note |
|---|---|---|
| Navigation Flow | Pass | Verified `category-details.tsx` logic. |
| Data Mapping | Pass | Verified `ProviderCard` shape in `marketplaceService.ts`. |
| DB Alignment | Pass | `PricingMode` matches `bookings_pricing_mode_check` constraint. |
| Back Navigation | Pass | Removed redundant hop prevents "back-button trap". |

---

## Final Recommendation
**Approve implementation.** The fixes directly address the user-reported issues and correctly align the application with the underlying database schema.

> [!TIP]
> Consider updating `frontend/app/__tests__/provider-list.test.tsx` to reflect the new `ProviderCard` mapping if it hasn't been updated yet.
