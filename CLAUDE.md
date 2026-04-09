# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with three independent subprojects:

| Directory | Purpose | Stack |
|---|---|---|
| `backend/` | REST API | NestJS, TypeScript |
| `mobile/` | Mobile app | Expo + React Native, TypeScript |
| `desktop/` | Admin/landing web apps | Next.js 15 (admin), Vite/React (landing, provider) |

The `backend/` and `mobile/` connect to the **same** Supabase project (`strtoeeidqnsmbszhjhe`). The `desktop/` apps are UI prototypes from a Figma community file.

---

## Backend — `backend/`

### Commands

```bash
cd backend

npm install
npm run start:dev    # dev server with watch — port 4000
npm run build
npm run start:prod

npm run test                          # all unit tests
npm run test -- --testPathPattern=booking  # run a single test file
npm run test:e2e
npm run test:cov
npm run lint
```

### Environment

Copy `.env.example` and fill in:
```
SUPABASE_URL=
SUPABASE_SECRET_KEY=   # service role key (not anon)
JWT_SECRET=
PORT=4000
ALLOWED_ORIGINS=       # comma-separated, optional
```

### Architecture

NestJS module-per-domain layout under `src/modules/`:

- **auth** — registration (customer + provider), login, JWT, token refresh
- **users** — customer profile reads/updates
- **customer** — customer-specific dashboard and booking queries
- **provider** — provider profile, trust score, reviews, dashboard
- **booking** — booking CRUD and status transitions
- **payments** — payment creation and provider earnings
- **addresses** — customer address management
- **chat** — real-time messaging
- **notifications** — push/in-app notifications
- **uploads** — file/image uploads to Supabase Storage
- **admin** — document status management
- **services** — service category listings
- **locations** — Philippine location reference data (PSGC)
- **reference** — generic lookup data

**Guards**: `AppAuthGuard` (not `SupabaseAuthGuard`) protects all controllers unless decorated `@Public()`.

**Database DI — `src/database/supabase.module.ts`**

`SupabaseModule` is `@Global()` and exposes per-schema injection tokens, each wrapped in a Circuit Breaker (trips after 5 failures, resets after 30 s):

```typescript
import { IDENTITY_CLIENT, CATALOG_CLIENT, BOOKING_CLIENT,
         PAYMENT_CLIENT, TRUST_CLIENT, NOTIFICATION_CLIENT } from '../../database/supabase.module';

// Inject with @Inject(IDENTITY_CLIENT) private identityClient: SupabaseClient
```

**Resilience patterns** (`src/common/utils/resilience.utils.ts`): Circuit Breaker + exponential backoff retries via RxJS. Side effects (e.g. creating payments after a booking) are handled with `@nestjs/event-emitter`.

**Known Issue**: `src/config/supabaseClient.js` still has hardcoded credentials — it is unused by the NestJS DI path but should still be fixed to read from `process.env`.

---

## Mobile App — `mobile/`

### Commands

```bash
cd mobile

npm install
npx expo start           # Expo dev server
npx expo start --tunnel  # use if LAN fails
npm run android
npm run ios

npm test                                    # all Jest tests
npm test -- --testPathPattern=BookingForm   # run a single test file
npm run lint
```

### Environment

Create `mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://strtoeeidqnsmbszhjhe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:4000   # or ngrok URL when testing on device
```

For device testing, run `ngrok http 4000` and set `EXPO_PUBLIC_API_URL` to the forwarding URL.

### Architecture

**Routing** — Expo Router (file-based). `app/` contains thin route files only.

- `app/(tabs)/` — customer tab group: home, bookings, messages, more
- `app/(provider-tabs)/` — provider tab group: home, bookings, messages, pricing, ratings, metrics, more
- Flat screens outside tabs are prefixed by role: `customer-*`, `provider-*`

**Feature-Based Modules** — business logic lives in `src/features/`:

- `src/features/auth/screens/` — login, signup, forgot-password screens (customer + provider)
- `src/features/bookings/screens/` — booking details, cancel, list screens
- `src/features/common/` — shared feature utilities

**Shared UI** — `src/components/common/`: `AppButton`, `AppPressable`, `AppTextInput`. These are built on design tokens from `constants/tokens.ts` and `constants/theme.ts`.

**State / Auth** (`lib/auth-session.ts` + `context/AuthContext.tsx`):
- `lib/auth-session.ts` — snapshot store for `{ session, user }`, backed by SecureStore; use `useSyncExternalStore` to subscribe
- `context/AuthContext.tsx` — React context wrapping the snapshot; exposes `session`, `user`, `isLoading`, `passwordResetPending`
- `app/_layout.tsx` → `AuthGate` — reads `db_role` from user metadata and redirects to the correct tab group

**Backend communication** (`lib/apiClient.ts`):
All calls to the NestJS backend go through `lib/apiClient.ts`, which handles auth headers, 401 token refresh, and query-string serialization. Direct Supabase queries still use the schema-scoped clients below.

**Supabase clients (`lib/db.ts`)**:

```typescript
import { identityDb, providerCatalogDb, bookingDb, paymentDb, trustDb, notificationDb, supabase } from '../lib/db';

identityDb.from('users')                // identity_svc
providerCatalogDb.from('provider_profiles') // provider_catalog_svc
bookingDb.from('bookings')              // booking_svc
paymentDb.from('payments')              // payment_svc
trustDb.from('reviews')                 // trust_svc
notificationDb.from('notifications')    // notification_svc

supabase.auth / supabase.storage / supabase.channel()  // always bare client
```

### Schema Map

| Schema | Key Tables |
|---|---|
| `identity_svc` | users, customer_profiles, user_addresses, auth_sessions, otp_codes |
| `provider_catalog_svc` | provider_profiles, provider_verification, provider_services, service_categories, provider_documents |
| `booking_svc` | bookings, booking_attachments, booking_reschedule_requests, additional_charges, provider_availability, provider_days_off, conversations, messages |
| `payment_svc` | payments, provider_payouts |
| `trust_svc` | reviews, provider_profile_reports |
| `notification_svc` | notifications, support_tickets, disputes |

### Microservice Migration Status

SQL migration files are in `mobile/supabase/microservices/` (00–03). Tables still live in `public` until a Supabase org admin runs the migrations and exposes the new schemas. See `mobile/CLAUDE.md` for the full migration checklist and rollback SQL.

### Testing

- **Unit/integration**: Jest + React Testing Library. Test files live in `__tests__/` directories and alongside feature screens.
- **E2E**: Maestro flows in `mobile/.maestro/` — run with `maestro test .maestro/<flow>.yaml`.

---

## Desktop — `desktop/`

Three apps under `desktop/apps/`: `admin` (Next.js 15), `landing`, `provider` (both Vite/React). The `landing` and `provider` apps are UI prototypes from a Figma community file. The `admin` app is partially integrated with the backend.

### Admin app — `desktop/apps/admin/`

```bash
cd desktop/apps/admin

npm install
npm run dev    # Next.js dev server — port 3001
npm run build
npm run lint
```

Create `desktop/apps/admin/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Architecture**

Next.js 15 App Router. Route files in `src/app/(dashboard)/` are thin shells — all page logic lives in `src/app/pages/` (React components imported by the route files).

**API layer (`src/lib/adminApi.ts`)** — single module for all backend calls. Import from here; never call `fetch` directly in page components.
- Real endpoints: `adminLogin()`, `updateDocumentStatus()`
- Stubs (return `null`, each has a `// TODO:` comment naming the needed endpoint): `getDashboardStats()`, `getProviderApplications()`, `getProviders()`, `getBookings()`, `getTransactions()`
- When a stub returns `null`, the app shows empty state. To wire a real endpoint: implement the fetch in `adminApi.ts` and remove the stub.

**Auth (`src/app/contexts/AuthContext.tsx`)** — calls `adminApi.adminLogin()`. JWT stored in `localStorage` under key `servease_admin_token`. Admin profile stored under `servease_admin`. Import `useAuth()` to access `{ admin, isAuthenticated, login, logout }`.

**Data (`src/contexts/DataContext.tsx`)** — fetches all data on mount via `adminApi.*` stubs. Exposes `isLoading`, `error`, and all data arrays. Mutation actions (`updateBookingStatus`, `approveRefund`, etc.) are local-state-only with `// TODO:` comments marking where real API calls will go. Import `useData()` in page components.

**Known pre-existing TypeScript errors** (do not fix unless specifically working on these files):
- `src/app/components/ProtectedRoute.tsx` — 1 syntax error
- `src/imports/pasted_text/application-helpers.ts` — many parse errors