# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This workspace contains two independent subprojects:

| Directory | Purpose |
|---|---|
| `ServEase-BE-API-main/` | NestJS REST API (TypeScript) |
| `ServEase-mobile-test-expov3/` | Expo + React Native mobile app (TypeScript) |

**They connect to different Supabase projects and are not yet integrated.**

---

## Backend — `ServEase-BE-API-main/`

### Commands

```bash
cd ServEase-BE-API-main

npm install          # install deps
npm run start:dev    # dev server with watch (port 5000)
npm run build        # compile to dist/
npm run start:prod   # run compiled output

npm run test         # unit tests (jest, matches *.spec.ts)
npm run test:e2e     # e2e tests
npm run test:cov     # coverage report
npm run lint         # eslint --fix
```

### Known Issues

- `src/config/supabaseClient.js` has the Supabase URL and anon key **hardcoded** — it ignores `.env`. This file should be updated to read from `process.env` to match how `SupabaseModule` works.
- The backend connects to a **different Supabase project** (`onbojolpltzjyyruwevk`) than the mobile app (`strtoeeidqnsmbszhjhe`). No microservice schema migration has been applied to the backend.

### Environment

Copy `.env.example` and fill in:
```
SUPABASE_URL=
SUPABASE_SECRET_KEY=   # service role key (not anon)
JWT_SECRET=
PORT=5000
```

### Architecture

NestJS module-per-domain layout under `src/modules/`:

- **auth** — registration (customer + provider), login, JWT; uses `SupabaseAuthGuard` to verify bearer tokens via Supabase
- **users** — customer profile reads/updates
- **customer** — customer-specific dashboard and booking queries
- **provider** — provider profile, trust score, reviews, dashboard
- **booking** — booking CRUD and status transitions
- **payments** — payment creation and provider earnings
- **admin** — document status management
- **services** — service category listings
- **locations** — Philippine location reference data
- **reference** — generic reference/lookup data

`SupabaseModule` is `@Global()` and injects a single `SupabaseClient` (service-role key) everywhere via DI.

All controllers are protected by `SupabaseAuthGuard` unless explicitly public. DTOs use `class-validator` decorators; `ValidationPipe` is applied globally.

---

## Mobile App — `ServEase-mobile-test-expov3/`

### Commands

```bash
cd ServEase-mobile-test-expov3

npm install
npm run start        # Expo dev server
npm run android
npm run ios
npm run web
npm run lint

# If local network fails:
npx expo start --tunnel
```

### Architecture

Expo Router (file-based routing). Two tab groups:

- `app/(tabs)/` — customer tabs: home, bookings, messages, more
- `app/(provider-tabs)/` — provider tabs: home, bookings, messages, pricing, ratings, metrics, more

Flat screens outside tabs are prefixed by role: `customer-*`, `provider-*`.

**State / Auth**
- `context/AuthContext.tsx` — wraps Supabase auth session; exposes `session`, `role`, `loading`
- `app/_layout.tsx` → `AuthGate` — reads `db_role` from user metadata and redirects to customer or provider tab group on login

**Supabase clients (`lib/db.ts`)**

The database is being migrated from `public` schema to 6 microservice schemas. All service files use schema-scoped clients:

```typescript
import { identityDb, providerCatalogDb, bookingDb, paymentDb, trustDb, notificationDb, supabase } from '../lib/db';

identityDb.from('users')                         // identity_svc
providerCatalogDb.from('provider_profiles')      // provider_catalog_svc
bookingDb.from('bookings')                       // booking_svc
paymentDb.from('payments')                       // payment_svc
trustDb.from('reviews')                          // trust_svc
notificationDb.from('notifications')             // notification_svc

supabase.auth / supabase.storage / supabase.channel()  // always bare client
```

> The migration SQL is in `supabase/microservices/` (00–03). The tables still live in `public` until an Supabase org admin exposes the new schemas. Check `CLAUDE.md` inside the mobile app for migration status.

**Services layer (`services/`)**
One file per domain — `bookingService.ts`, `chatService.ts`, `providerProfileService.ts`, etc. — all thin wrappers over the schema-scoped Supabase clients above.

**Theme**
Single source of truth: `constants/theme.ts`. Use `ThemedText` / `ThemedView` components for colour-aware rendering.

### Schema Map

| Schema | Key Tables |
|---|---|
| `identity_svc` | users, customer_profiles, user_addresses |
| `provider_catalog_svc` | provider_profiles, provider_verification, provider_services, service_categories |
| `booking_svc` | bookings, booking_attachments, conversations, messages, provider_availability |
| `payment_svc` | payments, provider_payouts |
| `trust_svc` | reviews, provider_profile_reports |
| `notification_svc` | notifications, support_tickets, disputes |
