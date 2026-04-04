# Review (V3): Provider Discovery Fix

**Date:** 2026-04-05  
**Reviewer:** Gemini (Adversarial Reviewer)  
**Status:** ❌ REJECTED - MULTIPLE HIGH-SEVERITY REGRESSIONS

---

## Summary

Third pass review confirms that while the primary goal (navigation) was met, the implementation introduces critical data flow and UX bugs that will degrade application stability and user trust.

---

## 🚩 High-Severity Findings

### 1. React Key Collisions (App Stability)
In `provider-list.tsx`, `key={provider.id}` uses the provider's `user_id`.
- **Bug:** The API returns search results at the **service level**. If a provider matches multiple times (e.g. they listed both "Standard Cleaning" and "Deep Cleaning"), they appear twice in the list with the same `id`.
- **Impact:** Duplicate keys cause React rendering errors, lost state, and performance degradation.

### 2. Broken Booking Selection (Logic Correction)
The system passes `serviceName` (Subcategory name) to the booking form to "guess" the service.
- **Bug:** Subcategory names often do not match exact service titles (e.g. Subcategory "Electrical" vs Service "Residential Electrical Wiring").
- **Impact:** The `customer-booking-form` fails the exact match and **fallbacks to the first service in the provider's list** (possibly a completely unrelated service like "Aircon Repair"). Users will book the wrong service.

### 3. Fragile UUID Incompatibility
Falling back to `row.id` (Service UUID) when `user_id` is missing in `marketplaceService.ts` is a silent failure.
- **Bug:** Downstream screens query the database using this ID as a `provider_id`. A Service UUID will never match a User ID.
- **Impact:** Profiles and booking forms will load "No data found" with no indication that the ID type was wrong.

---

## ⚠️ UX & Consistency Findings

### 4. "Price Unavailable" for Free Services
- **Bug:** In `marketplaceService.ts`, the check `rawPrice > 0` causes services with `price = 0` to return an empty `priceLabel`.
- **Impact:** `provider-list.tsx` renders this as "Price unavailable" instead of "Free" or "P0.00", while the `provider-profile.tsx` correctly renders it as "P0.00".

### 5. Redundant UI Text
- **Bug:** `ProviderCard.name` is populated with `businessName`. 
- **Impact:** `provider-list.tsx` renders both fields, resulting in the business name appearing twice in different font weights on every card.

---

## 🛠️ Required Fixes

1. **Deduplication:** The `marketplaceService.ts` should return a unique list of providers. If a search matches multiple services for one provider, the UI should either show one card with "Multiple services" or choose the best match.
2. **Proper ID Flow:** Pass both `providerId` (user_id) AND `serviceId` (service uuid) through the navigation stack to ensure the booking form doesn't have to "guess" the service by name.
3. **Correct Fallbacks:** Handle `price = 0` explicitly and remove the dangerous `row.id` fallback for `provider.id`.

---
❌ **Approval Status:** **REJECTED**
