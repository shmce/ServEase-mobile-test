# Post-Booking UX Fixes — Design Spec

**Date:** 2026-04-06  
**Author:** Claude (spec owner)  
**Risk level:** Low  

---

## Goal

Fix two bugs in the customer post-booking flow:

1. Customer has no forward navigation after a fresh booking — only a Cancel button and a back chevron that returns to the booking form stack.
2. Provider avatar in `CustomerBookingDetailsScreen` is always a placeholder (`pravatar.cc`) instead of the real photo from `provider_profiles.avatar_url`.

---

## Scope

- `mobile/src/features/bookings/screens/CustomerBookingDetailsScreen.tsx` — both fixes live here.
- No new screens, no new services, no schema changes.

---

## Non-goals

- A dedicated booking-success/confirmation screen.
- Changes to the Bookings tab list view.
- Any changes to the provider profile upload or storage flow.

---

## Files / Areas Affected

| File | Change |
|---|---|
| `mobile/src/features/bookings/screens/CustomerBookingDetailsScreen.tsx` | Add "Go to My Bookings" button for `pending` status; add `avatar_url` to provider profile query and use it |

---

## Fix 1 — "Go to My Bookings" Button

### Behavior

- Rendered inside the existing `bottomActions` block, **only when `normalizedStatus === 'pending'`**.
- Tapping it calls `router.dismissAll()` then `router.replace('/(tabs)/bookings')`, clearing the booking form from the stack.
- Label: **"Go to My Bookings"**
- Style: primary green filled button (matches the `rebookButton` style already in the sheet).

### Why only `pending`

- `confirmed` / `in_progress`: Track + Cancel already serve as the primary CTAs.
- `completed`: Leave a Review + Book Again.
- `cancelled`: No forward action needed; back chevron is sufficient.

### Acceptance criteria

- After submitting a booking, customer sees "Go to My Bookings" in the bottom actions.
- Tapping it lands on the Bookings tab with no back-navigation path to the booking form.
- Existing Cancel button remains visible alongside it for `pending` status.

---

## Fix 2 — Real Provider Avatar

### Root cause

`loadLiveBooking` queries `provider_profiles` with:
```
select('user_id,business_name,average_rating,verification_status')
```
`avatar_url` is not fetched. The avatar is then hardcoded:
```typescript
avatar: `https://i.pravatar.cc/150?u=${bookingRow.provider_id}`,
```

### Fix

Add `avatar_url` to the select:
```
select('user_id,business_name,average_rating,verification_status,avatar_url')
```

Use it in the normalized provider object:
```typescript
avatar: profileRes.data?.avatar_url || `https://i.pravatar.cc/150?u=${bookingRow.provider_id}`,
```

The placeholder is kept as a fallback for providers who haven't uploaded a photo.

### Acceptance criteria

- When a provider has an `avatar_url` set, their real photo appears in the booking details card.
- When `avatar_url` is null/empty, the pravatar placeholder is shown (no broken image).

---

## Risks

- `router.dismissAll()` availability depends on Expo Router version. If unavailable, fall back to `router.replace('/(tabs)/bookings' as any)` alone — the stack may not fully clear but the destination is correct.
- Provider avatar URL could be a Supabase Storage path that requires a signed URL. If so, a follow-up task would be needed to generate a signed URL; the current fix is safe as a first pass using the stored URL directly.

---

## Verification Plan

1. Create a booking from the form → confirm "Go to My Bookings" appears on the details screen.
2. Tap it → confirm landing on the Bookings tab; confirm back gesture does not return to the booking form.
3. Open booking details for a provider with a real avatar → confirm real photo loads.
4. Open booking details for a provider with no avatar → confirm placeholder renders without error.
