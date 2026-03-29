# ServEase Backend API Gateway Migration — Design Spec

## Overview

Migrate the ServEase mobile app from direct Supabase client queries to a full API gateway pattern where all data reads and writes flow through the NestJS backend. The mobile app becomes a thin client; the backend owns all business logic and data access.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Full API gateway | All data queries route through backend. Mobile never touches Supabase data tables directly. |
| Auth | Pass-through Supabase JWT | Mobile keeps `supabase.auth` for login/signup/session. Sends the Supabase JWT to the backend in `Authorization: Bearer` header. Backend validates via `SupabaseAuthGuard`. |
| Backend schemas | Migrate to microservice schemas | Backend switches from `public` schema to the 6 microservice schemas (`identity_svc`, `provider_catalog_svc`, `booking_svc`, `payment_svc`, `trust_svc`, `notification_svc`) matching the mobile pattern. |
| Deployment | Out of scope | Backend URL configured via `EXPO_PUBLIC_API_BASE_URL` env var. Tunnel (`ngrok`) for local dev testing. |
| Client-side exceptions | `supabase.auth`, `supabase.storage`, `supabase.channel()` | Auth, file uploads, and realtime subscriptions stay as direct Supabase calls. |
| Migration approach | Thin pass-through first, then move logic | Phase 1 wires the plumbing. Phase 2 transfers business logic. |
| API version | `/api/v3/` | All new endpoints under v3 to avoid colliding with existing v1/v2 routes. |

## What Stays Client-Side

These continue to use the Supabase client SDK directly in the mobile app:

- **`supabase.auth`** — login, signup, session refresh, password reset, OAuth
- **`supabase.storage`** — image/file uploads (booking attachments, KYC documents)
- **`supabase.channel()`** — realtime subscriptions for chat messages and notifications
- **`context/AuthContext.tsx`** and **`hooks/useAuth.ts`** — session management
- **`lib/auth-reset.ts`** — password reset deep link parsing
- **`lib/communication.ts`** — phone call utility, initials helper
- **`lib/notification-preferences.ts`** — local AsyncStorage preferences
- **`lib/provider-service-session.ts`** — local timer session (AsyncStorage)

## Architecture

```
Mobile App
  |
  |-- supabase.auth          --> Supabase Auth (direct)
  |-- supabase.storage       --> Supabase Storage (direct)
  |-- supabase.channel()     --> Supabase Realtime (direct)
  |
  |-- lib/api.ts (HTTP client)
        |
        |-- Authorization: Bearer <supabase-jwt>
        |
        v
NestJS Backend (port 5000)
  |
  |-- SupabaseAuthGuard (validates JWT on every request)
  |
  |-- Schema-scoped DB clients
  |     |-- identityDb        (identity_svc)
  |     |-- providerCatalogDb (provider_catalog_svc)
  |     |-- bookingDb         (booking_svc)
  |     |-- paymentDb         (payment_svc)
  |     |-- trustDb           (trust_svc)
  |     |-- notificationDb    (notification_svc)
  |
  v
Supabase PostgreSQL
```

## Phase 1 — Plumbing (Thin Pass-Through)

### Backend Changes

#### 1. Schema-scoped DB clients

Create `src/lib/db.ts` mirroring the mobile pattern. Update `SupabaseModule` to provide schema-scoped clients as injectable services. All existing and new backend services use these instead of the `public` schema.

#### 2. Standardize auth guard

Apply `SupabaseAuthGuard` globally via `APP_GUARD` provider. Exempt only the health check endpoint. Remove manual token validation from individual controllers (e.g., booking controller).

#### 3. New v3 endpoints (~35-40 total)

All under `/api/v3/`. Phase 1 implementations are thin: validate auth, call Supabase, return result. Grouped by module:

**Auth** (existing v1/v2 endpoints remain, no new v3 needed — mobile uses `supabase.auth` directly)

**Users / Profiles**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/users/profile` | `profileService.getProfile()` |
| PATCH | `/users/profile` | `profileService.updateProfile()` |

**Provider Profiles**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/providers/profile/draft/:userId` | `providerProfileService.getProviderProfileDraft()` |
| PUT | `/providers/profile/draft/:userId` | `providerProfileService.saveProviderProfileDraft()` |
| GET | `/providers/verification/draft/:userId` | `providerVerificationService.getProviderVerificationDraft()` |
| PUT | `/providers/verification/draft/:userId` | `providerVerificationService.saveProviderVerificationDraft()` |
| GET | `/providers/:providerId` | `marketplaceService.getProviderProfileData()` |

**Addresses**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/addresses/:userId` | `addressService.getUserAddresses()` |
| POST | `/addresses` | `addressService.addAddress()` |
| PATCH | `/addresses/:id` | `addressService.updateAddress()` |
| DELETE | `/addresses/:id` | `addressService.deleteAddress()` |

**Marketplace**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/marketplace/categories` | `marketplaceService.getServiceCategories()` |
| GET | `/marketplace/categories/:name/services` | `marketplaceService.getServicesByCategoryName()` |
| GET | `/marketplace/services/:name/providers` | `marketplaceService.getProvidersByServiceName()` |

**Bookings**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| POST | `/bookings` | `bookingService.createBooking()` |
| GET | `/bookings/customer/:customerId` | `bookingService.getCustomerBookings()` |
| GET | `/bookings/provider/:providerId` | `providerBookingService.getProviderBookings()` |
| GET | `/bookings/:bookingId` | `bookingService.getBookingById()` |
| PATCH | `/bookings/:bookingId/status` | `providerBookingService.updateBookingStatus()` |
| POST | `/bookings/:bookingId/cancel` | `bookingService.cancelCustomerBooking()` |
| POST | `/bookings/:bookingId/reschedule` | `providerBookingActionsService.createProviderRescheduleRequest()` |
| GET | `/bookings/:bookingId/reschedules` | `providerBookingActionsService.getProviderRescheduleRequests()` |
| PATCH | `/bookings/reschedules/:id/review` | `providerBookingActionsService.reviewRescheduleRequest()` |
| POST | `/bookings/:bookingId/charges` | `providerBookingActionsService.createProviderAdditionalChargeRequest()` |
| GET | `/bookings/:bookingId/charges` | `providerBookingActionsService.getProviderAdditionalChargeRequests()` |
| PATCH | `/bookings/charges/:id/review` | `providerBookingActionsService.reviewAdditionalChargeRequest()` |

**Payments**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/payments/booking/:bookingId` | `paymentService.getPaymentByBookingId()` |
| GET | `/payments/provider/:providerId` | `paymentService.getProviderPayments()` |
| GET | `/payments/provider/:providerId/history` | `paymentService.getProviderPaymentHistory()` |
| GET | `/payments/provider/:providerId/earnings` | `paymentService.getProviderEarningsSummary()` |

**Chat**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/chat/customer/:customerId/summaries` | `chatService.getCustomerChatSummaries()` |
| GET | `/chat/provider/:providerId/summaries` | `chatService.getProviderChatSummaries()` |
| GET | `/chat/thread` | `chatService.getChatThread()` (query params: bookingId, customerId, providerId) |
| POST | `/chat/message` | `chatService.sendChatMessage()` |
| PATCH | `/chat/thread/read` | `chatService.markChatThreadRead()` |

**Reviews & Reports**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| POST | `/reviews` | `customerFeedbackService.submitCustomerReview()` |
| POST | `/reports/provider` | `customerFeedbackService.submitProviderProfileReport()` |

**Notifications**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/notifications/:userId` | `notificationService.getNotifications()` |
| PATCH | `/notifications/:userId/:notificationId/read` | `notificationService.markNotificationRead()` |
| PATCH | `/notifications/:userId/read-all` | `notificationService.markAllNotificationsRead()` |
| GET | `/notifications/:userId/unread-count` | `notificationService.getUnreadNotificationCount()` |

**Provider Operations**
| Method | Path | Maps to mobile |
|--------|------|---------------|
| GET | `/providers/availability/:userId` | `providerAvailabilityService.getProviderAvailability()` |
| PUT | `/providers/availability/:userId` | `providerAvailabilityService.saveProviderAvailability()` |
| POST | `/support/ticket` | `supportService.createSupportTicket()` |
| POST | `/support/dispute` | `providerBookingService.createProviderDispute()` |

### Mobile App Changes

#### 1. New HTTP client: `lib/api.ts`

```typescript
// Reads EXPO_PUBLIC_API_BASE_URL from environment
// Gets current Supabase session token via supabase.auth.getSession()
// Attaches Authorization: Bearer <token> to every request
// Typed helpers: api.get<T>(), api.post<T>(), api.patch<T>(), api.delete<T>()
// Error handling: 401 triggers sign-out, unified error shape
```

#### 2. Rewrite all 16 service files

Replace every `identityDb.from()`, `bookingDb.from()`, etc. with `api.get()` / `api.post()` calls to the corresponding v3 endpoint. Remove all Supabase client imports from service files.

#### 3. New env var

Add `EXPO_PUBLIC_API_BASE_URL` to `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### 4. Remove from services

- All `*Db.from()` calls
- Multi-schema fallback strategies (backend handles canonical schema)
- Embedded business logic (kept temporarily in Phase 1, removed in Phase 2)

## Phase 2 — Logic Transfer

Move business logic from mobile service files into backend services. After Phase 2, mobile services are pure API call wrappers with no data manipulation.

### Business logic to move

| Logic | Current location (mobile) | Target location (backend) |
|-------|--------------------------|--------------------------|
| Booking state machine (status transitions + validation) | `providerBookingService.ts` | `BookingService` |
| Payment sync (auto-paid on complete, cancel on cancel) | `providerBookingService.ts`, `paymentService.ts` | `PaymentsService` |
| Booking reference generation (`BK-{timestamp}-{random}`) | `bookingService.ts` | `BookingService` |
| Provider availability validation | `providerAvailabilityService.ts` | `ProviderModule` (new service) |
| Review rating recalculation + provider profile update | `customerFeedbackService.ts` | `ProviderService` |
| Verification scoring algorithm (100-point scale) | `providerVerificationService.ts` | `ProviderModule` (new service) |
| Additional charges → booking/payment amount update | `providerBookingActionsService.ts` | `BookingService` |
| Payment history enrichment (platform fee calc, net earnings) | `paymentService.ts` | `PaymentsService` |
| Chat conversation upsert + unread tracking | `chatService.ts` | New `ChatModule` |
| Notification creation (booking status, chat) | `notificationService.ts`, `bookingService.ts` | New `NotificationModule` |
| Marketplace provider card building (price mapping, enrichment) | `marketplaceService.ts` | `ServicesService` |
| Booking cancellation (payment cancel + notification) | `bookingService.ts` | `BookingService` |

### Mobile services after Phase 2

Each service file becomes a thin wrapper:

```typescript
// bookingService.ts after Phase 2
import { api } from '../lib/api';

export const createBooking = (data: CreateBookingInput) =>
  api.post('/api/v3/bookings', data);

export const getCustomerBookings = (customerId: string) =>
  api.get(`/api/v3/bookings/customer/${customerId}`);

export const cancelCustomerBooking = (bookingId: string, reason: string) =>
  api.post(`/api/v3/bookings/${bookingId}/cancel`, { reason });
```

No Supabase imports. No business logic. No multi-table operations.

## Endpoint Count Summary

| Module | Endpoints |
|--------|-----------|
| Users / Profiles | 2 |
| Provider Profiles | 5 |
| Addresses | 4 |
| Marketplace | 3 |
| Bookings | 12 |
| Payments | 4 |
| Chat | 5 |
| Reviews & Reports | 2 |
| Notifications | 4 |
| Provider Operations | 4 |
| **Total** | **45** |

## Files Changed (Summary)

### Backend — New/Modified
- `src/lib/db.ts` — new, schema-scoped clients
- `src/database/supabase.module.ts` — modified, provide schema clients
- `src/modules/auth/guards/supabase-auth.guard.ts` — modified, register as global guard
- `src/app.module.ts` — modified, add new modules + global guard
- 10 module directories under `src/modules/` — new controllers, services, DTOs for v3 endpoints
- All existing services — modified to use schema-scoped clients

### Mobile — New/Modified
- `lib/api.ts` — new, HTTP client
- `.env` — modified, add `EXPO_PUBLIC_API_BASE_URL`
- All 16 files in `services/` — rewritten to use `api.*` calls
- `lib/db.ts` — kept but imports reduced (only used for realtime)

### Mobile — Special Cases
- `lib/customer-session.ts` — `registerCustomerAccount()` switches to call the existing backend v1 register endpoint instead of writing to Supabase directly. `loginCustomer()` keeps `supabase.auth.signInWithPassword()` but the post-login DB upsert (ensuring user record exists) becomes a backend call. Local draft management (AsyncStorage) stays as-is.
- `services/providerVerificationService.ts` — AsyncStorage draft storage stays local on the device. Only the remote Supabase read/write (provider_profiles verification_status) routes through the backend. The scoring algorithm moves to the backend in Phase 2.

### Not Changed
- `lib/supabase.ts` — Supabase client init
- `context/AuthContext.tsx` — auth session management
- `hooks/useAuth.ts` — auth hook
- `lib/auth-reset.ts` — password reset parsing
- `lib/communication.ts` — phone/initials utility
- `lib/notification-preferences.ts` — local preferences
- `lib/provider-service-session.ts` — local timer
- `lib/booking-status.ts` — UI presentation helpers (status labels, tracking steps)
- `lib/error-handling.ts` — error message normalization (adapted for API errors)
- All screen files in `app/` — unchanged, they import from services
- All component files — unchanged
