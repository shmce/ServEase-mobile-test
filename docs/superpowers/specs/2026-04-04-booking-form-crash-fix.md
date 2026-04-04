# Spec: Fix Customer Booking Form Crash

**Date:** 2026-04-04  
**Author:** Claude (spec owner)  
**Status:** Ready for implementation

---

## Goal

Identify and fix the crash/failure paths in `frontend/app/customer-booking-form.tsx` that prevent customers from successfully creating a booking.

---

## Context

Code review revealed three distinct failure paths in the booking form. The user reported a crash on submission. None of these require schema migration to fix — they are code bugs.

### Failure Path 1 — `pricing_mode: 'flat_rate'` sent to backend (HIGH)

**Location:** `frontend/services/bookingService.ts` line 13

```typescript
pricing_mode: bookingData.pricing_mode || 'flat_rate',
```

The backend DTO (`CreateBookingDto`) validates `@IsIn(['hourly', 'flat'])`. The string `'flat_rate'` fails this check and the backend returns a 400 error. The form's `handleConfirmBooking` inline fallback (`pricingMode || (selectedService?.supports_hourly ? 'hourly' : 'flat')`) normally prevents this, but the `bookingService` layer has its own independent fallback that uses the wrong string. Any caller that passes a falsy `pricing_mode` directly to `createBooking` (e.g. future callers, tests) will hit this.

**Fix:** Change `'flat_rate'` → `'flat'` in `bookingService.ts`.

---

### Failure Path 2 — `scheduled_at: undefined` crashes validation (MEDIUM)

**Location:** `frontend/services/bookingService.ts` lines 14–17

```typescript
scheduled_at: parseScheduleLocal(
  String(bookingData.scheduled_date_key || bookingData.scheduled_date || '').trim(),
  String(bookingData.scheduled_time || '').trim()
)?.toISOString(),
```

`parseScheduleLocal` returns `null` if the date/time cannot be parsed (e.g. empty string, unexpected format). `null?.toISOString()` evaluates to `undefined`. Sending `scheduled_at: undefined` causes the backend `@IsDateString() @IsNotEmpty()` validator to reject the request with a 400 error.

The form's `validateBooking()` checks `!date` and `!time` but does not guard against a successful `date + time` combination that fails `parseScheduleLocal` (e.g., a `date` string that is human-readable `"April 10, 2026"` instead of a `YYYY-MM-DD` key). This is a defensive issue — the form relies on `dateKey` (the `YYYY-MM-DD` format) but doesn't verify it maps correctly.

**Fix:** In `bookingService.ts`, throw an explicit error if `parseScheduleLocal` returns null, rather than sending `undefined`. This surfaces the problem to the user rather than producing a cryptic backend validation error.

---

### Failure Path 3 — Service options not loading (HIGH, environment-dependent)

**Location:** `frontend/app/customer-booking-form.tsx` lines 784–793

```typescript
let query = providerCatalogDb
  .from('provider_services')
  .select('id,title,price,...')
  .order('title', { ascending: true });
```

This queries `provider_catalog_svc.provider_services` via the schema-scoped Supabase client. If the `provider_catalog_svc` schema has not been exposed in the Supabase Dashboard (see `frontend/CLAUDE.md` — migration is still PENDING), this query fails with a Supabase error. The catch block sets `servicesLoadError`, but the validation in `validateBooking` blocks the booking with the message _"This provider has no active services yet"_, which is misleading. Users cannot proceed.

This is not a code bug but an infrastructure dependency. However, the error message should be more informative so users and developers can distinguish "no services configured" from "schema not exposed."

**Fix (code):** Improve the error message in `setServicesLoadError` to distinguish infrastructure errors from genuine empty states. Also check whether `error` from Supabase has a recognisable code for schema permission errors.

**Fix (infra — separate ticket):** Expose `provider_catalog_svc` in Supabase Dashboard → Settings → API → Data API → Exposed schemas (requires Supabase org Owner/Admin role).

---

## Scope

- `frontend/services/bookingService.ts` — fix `pricing_mode` fallback, fix `scheduled_at` null guard
- `frontend/app/customer-booking-form.tsx` — improve service-load error message to distinguish infra errors

## Non-goals

- Running Supabase schema migration (separate infra task, requires org admin access)
- Refactoring the booking form UI
- Adding new fields or changing the booking flow
- Fixing unrelated availability/address load failures (those degrade gracefully)

---

## Files / Areas Affected

| File | Change |
|---|---|
| `frontend/services/bookingService.ts` | `'flat_rate'` → `'flat'`; throw on null `scheduled_at` |
| `frontend/app/customer-booking-form.tsx` | Improve `servicesLoadError` message for infra vs. data distinction |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Changing `'flat_rate'` → `'flat'` affects other callers of `createBooking` | Low | Only two callers in codebase (form + tests); both already send valid values |
| Throwing on null `scheduled_at` makes the error visible to the user | Low | Desired — surfacing a silent failure is safer than sending `undefined` to the API |
| Schema exposure (infra) may not be done before code ships | Medium | Code change is independent; error message improvement is a safe no-risk fix |

---

## Acceptance Criteria

1. Submitting the booking form with `pricing_mode = null` (e.g. a service where both `supports_hourly` and `supports_flat` are false) no longer produces a backend 400 error — it sends `'flat'` and proceeds.
2. If `parseScheduleLocal` cannot produce a valid date, the user sees an explicit error message before the API is called (not a backend validation error).
3. If the Supabase schema is not exposed, the services load error clearly distinguishes "schema permission error" from "provider has no services."
4. The existing test in `app/__tests__/customer-booking-form.test.tsx` still passes.
5. A manual end-to-end test successfully creates a booking and navigates to `customer-booking-details` with the correct booking ID.

---

## Verification Plan

1. **Unit test** — Update `customer-booking-form.test.tsx` to add:
   - A case where `pricingMode` is null and verify `createBooking` is called with `pricing_mode: 'flat'` (not `'flat_rate'`)
   - A case with an invalid date format and verify a user-visible error, not an API call
2. **Manual smoke test** — Submit a flat-rate booking and an hourly booking end-to-end against the local backend. Confirm navigation to `customer-booking-details` with a real booking ID.
3. **Backend validation** — Optionally run the backend locally and confirm the DTO validation accepts both `'hourly'` and `'flat'` and rejects `'flat_rate'`.
