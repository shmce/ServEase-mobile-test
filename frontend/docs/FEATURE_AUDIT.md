# ServEase Mobile Feature Audit

This file is the current repo audit for what is already working, what is partially implemented, and what is still missing.

It is based on the actual code in this mobile repo as of March 26, 2026.

## Done

- Booking flow core
  - Customer booking creation, booking details, cancellations, notes, attachments, and payment record creation are wired into real services.
  - Provider booking lifecycle from `Upcoming` to `Completed` is connected across bookings list, details, navigation, start service, in-progress, completion, and receipt.
- Chat and messaging core
  - Main customer/provider inbox and thread flows use shared Supabase-backed chat logic in `services/chatService.ts`.
  - Read state, unread counts, realtime subscriptions, retry handling, and booking-linked chat routing are implemented.
- Notifications core
  - Notifications, unread counts, routing targets, filtering, and inbox UI are implemented.
  - Chat and booking lifecycle notifications are integrated.
- Provider availability
  - `app/provider-availability.tsx` loads and saves provider availability through `services/providerAvailabilityService.ts`.
  - Booking creation validates provider availability.
- Provider calendar core
  - `app/provider-calendar.tsx` now reflects real provider bookings and blocked days using Supabase-backed bookings and availability data.
- Provider edit profile core
  - `app/provider-edit-profile.tsx` now loads and saves provider profile data through `services/providerProfileService.ts`.
- Password reset flow
  - `app/provider-forgot-password.tsx`, `app/customer-forgot-password.tsx`, and `app/reset-password.tsx` now use Supabase recovery instead of fake success UI.
- Provider booking action requests
  - `app/provider-reschedule.tsx` and `app/provider-additional-charges.tsx` now load the real booking and submit DB-backed request records.
  - `app/customer-booking-details.tsx` now lets customers approve or decline pending reschedule and additional-charge requests, and approved requests are applied back into the booking.
- Pricing
  - `app/(provider-tabs)/pricing.tsx` is backed by Supabase for provider services.
- Address management
  - `app/add-address.tsx` and `app/edit-address.tsx` use real CRUD via `services/addressService.ts`.
- Provider support issue reporting
  - `app/provider-report-issue.tsx` inserts support tickets and disputes through `services/providerBookingService.ts`.
- Customer feedback core
  - `app/customer-review.tsx` now inserts real review rows through `services/customerFeedbackService.ts` and updates provider rating aggregates.
  - `app/customer-report-profile.tsx` now inserts real provider profile report rows through `services/customerFeedbackService.ts`.
- Help/support entry core
  - `app/help-center.tsx` and `app/provider-help.tsx` now support real ticket submission through `services/supportService.ts`, while keeping their FAQ/search experience.

## Partial

- Authentication and customer session state
  - Supabase auth is now the real customer auth source, but signup onboarding still uses a small local draft in `lib/customer-session.ts` until profile setup is completed.
- Notification preferences
  - Preference screens save and load real values for the device/app session, but persistence is local via AsyncStorage, not Supabase-backed.
- Provider verification
  - Provider verification UI and status flow exist, but detailed verification records still rely partly on local draft storage instead of a full Supabase-first workflow.
- Tracking
  - Booking status is real, but the live-tracking map/route/ETA experience is still mostly presentation-level rather than true trip telemetry.
- Booking management edge cases
  - Provider-side request submission and customer-side approval are now wired, but there is still room to deepen the UX around status history and provider-facing review feedback.
- Help/support experience
  - Help centers now submit real support tickets, but ticket history, agent responses, and richer booking-linked support flows are still missing.

## Still Missing

## Outdated Assumptions To Avoid

These statements are no longer accurate for this repo:

- "Messaging is entirely mock."
  - Not true anymore for the main inbox/thread flow. The primary chat path is wired through `services/chatService.ts`.
- "Provider availability does not save to the database."
  - Not true anymore. `app/provider-availability.tsx` and `services/providerAvailabilityService.ts` are wired.
- "Pricing is mocked."
  - Not true for the current provider pricing screen.
- "Start service is placeholder-only."
  - Not true anymore. The provider service-delivery flow is connected to booking state and local service session handling.
- "Address management is mostly mock."
  - Not true for add/edit/delete address CRUD.

## Highest-Priority Next Steps

1. Decide whether notification preferences should remain local-only or move into Supabase.
2. Expand provider verification from mixed local draft state into a fully DB-backed workflow.
3. Deepen booking-request UX with request history, provider-visible outcomes, and richer review messaging.
4. Replace the remaining presentation-level tracking experience with real trip telemetry and ETA updates.
5. Add support-ticket history and staff-response surfaces so users can track submitted requests.
