# Review (V2): Provider Discovery Fix

**Date:** 2026-04-05  
**Reviewer:** Gemini (Adversarial Reviewer)  
**Status:** ⚠️ CRITICAL FINDINGS - REVISION REQUIRED

---

## Summary

While the initial fix resolved the redundant navigation and correctly implemented the requested mapping, a deep dive into the data flow between the List, Profile, and Booking screens reveals **three High-Severity behavioral regressions** that will lead to broken UI and incorrect user data.

---

## Critical Findings

### 1. High Regression: React Key Collisions in Provider List
In `provider-list.tsx`, the `key={provider.id}` uses the mapped `user_id`.
- **Fault:** The `getProvidersByServiceName` API returns **service rows**. If a provider has multiple services matching the subcategory (e.g., "Standard Cleaning" and "Deep Cleaning" both under "Cleaning"), the list will contain duplicate `user_id` entries.
- **Impact:** React will throw duplicate key warnings, and state management for these rows (focused state, animations) will be broken/unpredictable.

### 2. High Regression: Incorrect Service Selection in Booking Form
The navigation stack passes `serviceName` (the subcategory name) through to the `customer-booking-form.tsx`.
- **Fault:** `customer-booking-form.tsx` (Line 873-881) attempts to auto-select a service by doing a case-insensitive name match against `params.serviceName`.
- **Scenario:** Tapping "Electrical" (Subcategory) -> Provider List -> Provider Profile -> Book Now. `serviceName` is "Electrical". The provider's actual service title is "Electrical Wiring". The form fails to match "Electrical" vs "Electrical Wiring", and **defaults to selecting the first service in the provider's list** (e.g. "Aircon Repair").
- **Impact:** Customers will accidentally book the wrong service if it doesn't exactly match the subcategory name.

### 3. Medium Risk: Silent Load Failure on ID Fallback
In `marketplaceService.ts`, if `user_id` is missing, it falls back to `row.id` (Service UUID).
- **Fault:** Downstream components (`provider-profile.tsx` and `customer-booking-form.tsx`) use `providerId` to query by `provider_id` (User ID). A Service UUID will yield **zero results** in these queries.
- **Impact:** The profile will show "Provider not found" or "No active services yet" instead of a clear error, making debugging difficult.

### 4. UI Polish: Redundant Naming
The `ProviderCard` mapping sets `name` and `businessName` to the same value. `provider-list.tsx` renders both, resulting in the same text appearing twice on every card.

---

## Verification Notes

| Test Item | Result | Note |
|---|---|---|
| Navigation Flow | Pass | The redundant hop is fixed. |
| React Keys | **FAIL** | Duplicate `user_id` in list results. |
| Auto-selection | **FAIL** | Name-based matching is fragile and likely to select the wrong index. |
| Data Loading | Mixed | Fragile fallback for IDs. |

---

## Required Fixes (Codex)

1. **Deduplicate Providers:** Group/Filter the response in `marketplaceService.ts` before returning to the UI to ensure only one card per provider.
2. **Pass Service ID:** The navigation param should ideally include a `suggestedServiceId` if one exists, or `provider-list` should be smarter about which service it "represents".
3. **Refine Name Matching:** At minimum, the `customer-booking-form` needs a more robust way to handle "search-term to service-title" mapping if IDs cannot be passed.
4. **Remove Fallback:** If `user_id` is missing, the row should be filtered out or throw a clear data-integrity error rather than falling back to an incompatible UUID type.

---
❌ **Approval Status:** **REJECTED PENDING FIXES**
