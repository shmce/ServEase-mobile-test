# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ServEase is a service marketplace app for on-demand services in the Philippines. This repo ("Backup System") contains two sub-projects:

- **ServEase-mobile-test/** — Expo/React Native mobile app (customer + provider flows)
- **Backend/ServEase-BE-API/** — NestJS REST API backend

Both connect to a shared **Supabase** instance (PostgreSQL + Auth + Storage + Realtime).

## Common Commands

### Mobile App (`ServEase-mobile-test/`)
```bash
npm install
npm run start          # Expo dev server
npx expo start --tunnel  # If local networking fails
npm run android
npm run ios
npm run web
npm run lint           # expo lint
```

### Backend API (`Backend/ServEase-BE-API/`)
```bash
npm install
npm run start:dev      # NestJS watch mode (port 5000)
npm run build          # nest build
npm run lint           # eslint --fix
npm run test           # jest unit tests
npm run test:e2e       # jest e2e tests (test/jest-e2e.json)
npm run test:cov       # jest coverage
npm run format         # prettier
```

## Architecture

### Mobile App
- **Framework**: Expo SDK 54, Expo Router 6, React Native 0.81, TypeScript
- **Routing**: File-based via `app/` directory. Customer screens use `app/(tabs)/` layout; provider screens use `app/(provider-tabs)/` layout. Screens are prefixed (`customer-*`, `provider-*`) for clarity.
- **Auth**: `context/AuthContext.tsx` provides session/user via Supabase Auth. `hooks/useAuth.ts` consumes it. `app/_layout.tsx` contains the `AuthGate` that routes users to the correct tab group based on role metadata.
- **Services layer**: `services/*.ts` files contain all Supabase data-access logic (booking, chat, payments, notifications, etc.). Screens import from services, not from Supabase directly.
- **Lib utilities**: `lib/` has helpers for sessions, booking status, communication, error handling, notification preferences, and the DB client.
- **Components**: `components/` for shared UI; `components/ui/` for smaller reusable pieces (cards, modals, badges).
- **Theming**: `constants/theme.ts` defines light/dark color tokens and platform-specific fonts.
- **Path alias**: `@/` maps to the project root (e.g., `@/lib/db`, `@/hooks/useAuth`).

### Backend API
- **Framework**: NestJS 11, TypeScript, runs on port 5000
- **Module structure**: `src/modules/` contains domain modules — `auth`, `admin`, `booking`, `customer`, `provider`, `payments`, `services`, `reference`, `locations`. Each module follows NestJS conventions (controller, service, module, DTOs).
- **Database**: Supabase JS client via `src/database/supabase.module.ts` and `src/config/supabaseClient.js`.
- **Auth guard**: `src/modules/auth/guards/supabase-auth.guard.ts` protects routes using Supabase JWT.
- **Validation**: Global `ValidationPipe` with `class-validator` DTOs.
- **Mock data**: `src/mock-data/` has Philippine locations and provider seed data.

### Supabase Schema (Microservice Migration — In Progress)

The database is migrating from a single `public` schema to 6 microservice schemas. SQL files live in `ServEase-mobile-test/supabase/microservices/`.

All mobile app queries use schema-scoped clients from `lib/db.ts`:
```typescript
import { identityDb, bookingDb, paymentDb, trustDb, notificationDb, providerCatalogDb } from '@/lib/db';

identityDb.from('users')             // identity_svc.users
bookingDb.from('bookings')           // booking_svc.bookings
providerCatalogDb.from('provider_services') // provider_catalog_svc.provider_services
```

Use bare `supabase` (from `lib/db.ts`) **only** for: `supabase.auth`, `supabase.storage`, `supabase.channel()`.

**Schema map:**
| Schema | Tables |
|---|---|
| `identity_svc` | users, customer_profiles, user_addresses, auth_sessions, otp_codes, app_policies, user_policy_acceptance |
| `provider_catalog_svc` | provider_profiles, provider_verification, provider_services, service_categories, provider_documents, location |
| `booking_svc` | bookings, booking_attachments, booking_reschedule_requests, additional_charges, provider_availability, provider_days_off, conversations, messages |
| `payment_svc` | payments, provider_payouts |
| `trust_svc` | reviews, provider_profile_reports |
| `notification_svc` | notifications, support_tickets, disputes |

### Migration SQL Run Order
1. `supabase/microservices/00_create_schemas.sql`
2. `supabase/microservices/01_drop_cross_service_fks.sql`
3. `supabase/microservices/02_migrate_tables.sql` (run after exposed schemas are updated in Supabase Dashboard)
4. `supabase/microservices/03_rls_and_grants.sql`
