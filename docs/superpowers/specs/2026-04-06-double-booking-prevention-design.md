# Double Booking Prevention — Design Spec

**Date:** 2026-04-06  
**Author:** Claude (spec owner)  
**Risk level:** Medium (touches booking creation path and DTO contract)

---

## Goal

Prevent a customer from booking a provider for a time slot that is already occupied by another active booking.

---

## Scope

- Backend: conflict check inside `BookingService.validateBookingRequest`, new check endpoint in `ProviderController`, DTO change for `hours_required`
- Frontend: show duration field for flat-rate bookings, call check endpoint before submission, always send `hours_required` in payload

---

## Non-goals

- Database-level exclusion constraints or schema migrations
- Blocking providers from double-booking themselves (provider-side calendar management is separate)
- Real-time slot locking / pessimistic concurrency (optimistic check is sufficient for this phase)

---

## Decisions

| Question | Decision |
|---|---|
| Duration when `hours_required` missing | Make it mandatory — remove `@IsOptional()` from DTO |
| Which statuses block a slot | `pending`, `confirmed`, `in_progress` |
| Conflict check location | Backend (authoritative) + frontend pre-check (UX) |
| Overlap algorithm | JS-side after fetching active bookings for provider on that date |

---

## Files / Areas Affected

| File | Change |
|---|---|
| `backend/src/modules/booking/dto/create-booking.dto.ts` | Remove `@IsOptional()` from `hours_required`, keep `@Min(1)` |
| `backend/src/modules/booking/booking.service.ts` | Add `checkConflict` private method; call it inside `validateBookingRequest` |
| `backend/src/modules/provider/provider.controller.ts` | Add `GET :providerId/availability/check` endpoint (no auth) |
| `backend/src/modules/provider/provider.service.ts` | Add `checkProviderAvailabilityConflict(providerId, scheduledAt, hoursRequired)` |
| `mobile/app/customer-booking-form.tsx` | Show duration field for flat-rate; always include `hours_required` in payload |
| `mobile/services/providerAvailabilityService.ts` | Extend `validateProviderAvailability` to call check endpoint |

---

## Backend Design

### DTO Change

`hours_required` becomes required for all bookings:

```typescript
@IsNumber()
@Min(1)
hours_required: number;
```

Remove `@IsOptional()`. This means every booking — hourly or flat — must carry a duration.

### Conflict Algorithm

```
newStart = scheduled_at (as Date)
newEnd   = newStart + hours_required * 3600000 ms

For each active booking B of this provider:
  bStart = B.scheduled_at
  bEnd   = bStart + B.hours_required * 3600000 ms
  if (newStart < bEnd && newEnd > bStart) → CONFLICT
```

Statuses that count as active: `pending`, `confirmed`, `in_progress`.  
Statuses that are free: `cancelled`, `completed`, `disputed`.

### `checkConflict` in `BookingService`

Called from `validateBookingRequest` after existing validation passes:

```typescript
private async checkConflict(
  providerId: string,
  scheduledAt: string,
  hoursRequired: number,
): Promise<void> {
  const newStart = new Date(scheduledAt).getTime();
  const newEnd = newStart + hoursRequired * 3600000;

  // Fetch active bookings for this provider on the same date (±1 day buffer)
  const dayStart = new Date(newStart - 24 * 3600000).toISOString();
  const dayEnd = new Date(newEnd + 24 * 3600000).toISOString();

  const existing = await getResult<Pick<Booking, 'scheduled_at' | 'hours_required'>[]>(
    this.bookingDb
      .from('bookings')
      .select('scheduled_at,hours_required')
      .eq('provider_id', providerId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd),
    'ConflictCheck',
    { allowEmpty: true },
  );

  for (const b of existing) {
    const bStart = new Date(b.scheduled_at).getTime();
    const bEnd = bStart + Number(b.hours_required || 1) * 3600000;
    if (newStart < bEnd && newEnd > bStart) {
      throw new BadRequestException(
        'This provider is already booked for the selected time slot.',
      );
    }
  }
}
```

### New Provider Check Endpoint

`GET /api/v1/provider/:providerId/availability/check?scheduled_at=...&hours_required=...`

No auth guard (mirrors existing `GET :providerId/availability`).

Returns:
```json
{ "available": true }
// or
{ "available": false, "reason": "This provider is already booked for the selected time slot." }
```

`ProviderService.checkProviderAvailabilityConflict` runs the same overlap algorithm, catches `BadRequestException`, and returns the `{ available, reason }` shape instead of throwing.

---

## Frontend Design

### Duration Field for Flat-Rate

Currently `{isHourly ? <HoursInput /> : null}` — remove the `isHourly` condition:

```tsx
{(isHourly || isFlat) ? (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      Estimated Duration (hours) <Text style={styles.requiredAsterisk}>*</Text>
    </Text>
    <View style={[styles.dropdownButton, { paddingLeft: 12 }]}>
      <Ionicons name="hourglass-outline" size={20} color="#0D1B2A" style={styles.inputIcon} />
      <TextInput
        style={[styles.dropdownText, { flex: 1, paddingLeft: 8 }]}
        value={hoursRequired}
        onChangeText={(v) => setHoursRequired(v.replaceAll(/\D/g, ''))}
        keyboardType="number-pad"
        placeholder="1"
      />
    </View>
    {isHourly ? (
      <Text style={styles.fieldHint}>
        Total: P{totalAmount.toFixed(2)} for {parsedHoursRequired} hour(s)
      </Text>
    ) : null}
  </View>
) : null}
```

### Payload Change

Always send `hours_required`:

```typescript
hours_required: parsedHoursRequired,  // was: isHourly ? parsedHoursRequired : null
```

### Pre-submit Conflict Check

Extend `validateProviderAvailability` in `providerAvailabilityService.ts` to call the check endpoint after the existing working-hours check:

```typescript
// After existing working-hours validation...
try {
  const result = await api.get<{ available: boolean; reason?: string }>(
    `/provider/${providerId}/availability/check`,
    { params: { scheduled_at: scheduledAt.toISOString(), hours_required: hoursRequired } }
  );
  if (!result.available) {
    return { available: false, reason: result.reason || 'This time slot is already booked.' };
  }
} catch {
  // Network failure — allow through, backend is authoritative
}

return { available: true };
```

The booking form already gates submission on `validateProviderAvailability` returning `available: true`, so no additional form wiring is needed.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Check endpoint unreachable | Frontend falls through to `available: true`; backend remains the gate |
| Backend conflict detected at insert time | `BadRequestException` → 400 with message shown to user |
| `hours_required` missing or < 1 | NestJS `ValidationPipe` → 400 before business logic |
| Cancelled/completed bookings | Excluded from conflict query via `.in('status', [...])` filter |

---

## Acceptance Criteria

1. Customer A books provider P at 2:00 PM for 2 hours → succeeds.
2. Customer B tries to book provider P at 3:00 PM for 1 hour (overlaps 2:00–4:00 PM) → blocked at form level before submit; blocked at API with 400 if UI bypassed.
3. Customer B books provider P at 4:01 PM for 1 hour (no overlap) → succeeds.
4. Flat-rate booking form shows "Estimated Duration" field, requires value ≥ 1.
5. `hours_required` omitted from API request → 400 from `ValidationPipe`.
6. A `cancelled` or `completed` booking for the same slot does not block new bookings.

---

## Risks

- **Existing flat-rate bookings in DB have `hours_required = null`**: The conflict check uses `Number(b.hours_required || 1)` as fallback, so old rows default to 1-hour blocks. Safe.
- **DTO breaking change**: Any client not sending `hours_required` will now get a 400. The mobile app is the only client and will be updated in the same task.
- **Race condition**: Two simultaneous requests can both pass the conflict check before either inserts. This is acceptable for phase 1 — a DB-level exclusion constraint can address it later if needed.
