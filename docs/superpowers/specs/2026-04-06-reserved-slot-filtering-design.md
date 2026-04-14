# Reserved Slot Filtering - Design Spec

**Date:** 2026-04-06
**Author:** Codex
**Risk level:** Medium (touches provider availability contract and booking form slot selection)

---

## Goal

Remove customer-visible time options that would overlap an existing active booking for the selected provider, date, and duration.

---

## Scope

- Backend: add a provider reserved-slots endpoint that returns occupied booking intervals for a given date
- Frontend: fetch reserved slots for the selected provider/date, filter time options with duration-aware overlap logic, and show a loading state while the reserved-slot filter is being applied

---

## Non-goals

- Replacing the submit-time conflict check endpoint
- Real-time slot locking
- Changing the provider availability schema or adding database migrations
- Introducing sub-hour time increments

---

## Decisions

| Question | Decision |
|---|---|
| Data source for slot filtering | New `GET /provider/:providerId/reserved-slots?date=YYYY-MM-DD` endpoint |
| Failure mode if reserved-slot fetch fails | Fail open: keep schedule-based slots visible, backend remains authoritative |
| Statuses that occupy time | `pending`, `confirmed`, `in_progress` |
| Recompute triggers | `providerId`, `dateKey`, reserved slots, `hours_required` |
| UX during reserved-slot fetch | Disable time picker and show loading copy |

---

## Files / Areas Affected

| File | Change |
|---|---|
| `backend/src/modules/provider/provider.controller.ts` | Add `GET :providerId/reserved-slots` endpoint |
| `backend/src/modules/provider/provider.service.ts` | Add reserved-slot query and interval mapping |
| `mobile/services/providerAvailabilityService.ts` | Add `getProviderReservedSlots` helper |
| `mobile/app/customer-booking-form.tsx` | Fetch reserved slots, filter `TIME_OPTIONS`, add loading state |
| `mobile/services/__tests__/providerAvailabilityService.test.ts` | Add reserved-slot fetch coverage |
| `mobile/app/__tests__/customer-booking-form.test.tsx` | Add duration-aware slot filtering tests |

---

## Backend Design

### Endpoint

`GET /api/v1/provider/:providerId/reserved-slots?date=YYYY-MM-DD`

Returns:

```json
{
  "reservedSlots": [
    {
      "scheduled_at": "2026-04-06T06:00:00.000Z",
      "end_at": "2026-04-06T08:00:00.000Z",
      "hours_required": 2
    }
  ]
}
```

### Query Behavior

- Parse the requested date as the local calendar day selected by the user
- Query active bookings for the provider within that day window
- For each booking:
  - `start = scheduled_at`
  - `end = scheduled_at + max(1, hours_required) hours`
- Exclude `cancelled`, `completed`, and `disputed`

### Error Handling

- Invalid or missing `date` -> `400`
- Unknown provider is not special-cased here; an empty result is acceptable because this endpoint is only used to filter time options

---

## Frontend Design

### Reserved Slot Fetch

When `providerId` and `dateKey` are present, fetch:

`/provider/:providerId/reserved-slots?date=${dateKey}`

Store:

- `reservedSlots`
- `isReservedSlotsLoading`
- `reservedSlotsFetchFailed`

If the request fails:

- set `reservedSlotsFetchFailed = true`
- keep `reservedSlots = []`
- continue showing schedule-based slots only

### Time Option Filtering

Start from the existing `TIME_OPTIONS` and apply filters in this order:

1. provider working-hours and day-off rules
2. provider break-period rules
3. reserved-slot overlap rules for the selected duration

Overlap rule:

```text
candidateStart < reservedEnd && candidateEnd > reservedStart
```

Where:

- `candidateStart` is the selected date + candidate time
- `candidateEnd` is `candidateStart + parsedHoursRequired`

### Loading UX

While reserved slots are loading for a selected date:

- disable opening the time modal
- show `"Loading available times..."` in the time field

Once loaded, show either:

- filtered time choices, or
- `"No available times"` if every candidate slot is blocked

---

## Acceptance Criteria

1. If a provider has an active booking from 2:00 PM to 4:00 PM, a 2-hour customer booking cannot select 1:00 PM, 2:00 PM, or 3:00 PM on that date.
2. The same provider/date still allows a 1-hour booking at 4:00 PM or later if it does not overlap.
3. Changing `hours_required` recomputes the visible time choices without reloading the screen.
4. If reserved-slot fetch fails, time choices still fall back to schedule-based filtering and submit-time backend validation still applies.
5. While reserved slots are loading, the time picker shows a loading state and cannot be opened.

---

## Risks

- Time-zone handling must stay consistent between `dateKey`, displayed times, and stored `scheduled_at`
- The booking form already contains a lot of selection logic; changes should stay modular and avoid widening unrelated behavior
- Filtering the UI improves guidance but must never replace the backend conflict check
