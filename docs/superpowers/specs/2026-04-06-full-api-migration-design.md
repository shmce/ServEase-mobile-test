# Full API Migration Design

Date: 2026-04-06
Owner: Codex
Status: Draft for review

## Goal

Migrate the mobile application to a backend-owned architecture where the mobile client talks only to the NestJS API. Supabase remains an internal backend infrastructure dependency for data, storage, and identity, but the mobile app no longer uses Supabase auth, direct schema clients, storage uploads, or realtime channels at runtime.

## Scope

- Replace mobile-owned authentication with backend-issued session handling.
- Move all direct mobile database reads and writes behind backend endpoints.
- Move all storage uploads behind backend upload endpoints.
- Replace direct mobile chat and notification persistence with backend APIs.
- Standardize mobile data access around the backend API client and backend DTOs.
- Preserve current user-facing behavior as closely as possible during migration.

## Non-goals

- Replatform away from Supabase on the backend.
- Introduce microservices or split the backend into deployable services.
- Redesign product behavior beyond what is required to remove direct frontend Supabase access.
- Deliver websocket or SSE infrastructure in the first migration phase unless needed to restore behavior parity.

## Current State Summary

The repository currently uses a mixed access model:

- Mobile routes many business flows through the NestJS API via `mobile/lib/apiClient.ts`.
- Mobile still calls Supabase auth directly for session state, login, signup, password reset, and logout.
- Mobile still queries schema-scoped Supabase clients directly for chat, provider services, availability, notifications, bookings, and some profile-related data.
- Mobile uploads files directly to Supabase storage for some flows.

This mixed model creates duplicated access control, fragmented contracts, and a frontend runtime dependency on backend storage and identity details.

## Target Architecture

### Backend Ownership

The NestJS backend becomes the only application-facing gateway. It owns:

- Authentication and session issuance
- Authorization checks
- DTO shaping and response normalization
- File upload orchestration
- Aggregation across Supabase schemas
- Fallback and error semantics

Supabase remains behind the backend for:

- Identity records and auth administration
- Schema-scoped data access
- Storage buckets
- Optional internal event and messaging support

### Mobile Ownership

The mobile app owns:

- Rendering and local UI state
- Secure persistence of backend session credentials
- API request orchestration through a shared API client
- Optimistic UI only where already supported or explicitly designed

The mobile app no longer owns:

- Supabase session lifecycle
- Direct schema queries
- Storage bucket access
- Realtime channel subscriptions tied directly to Supabase

## Recommended Migration Strategy

Use a strangler migration by capability rather than a big-bang cutover.

Why:

- It preserves rollback options.
- It reduces the blast radius of auth and chat changes.
- It lets backend contracts stabilize slice by slice.
- It supports fresh verification after each capability migration.

The final architecture is still fully API-only from the mobile client’s perspective.

## Auth and Session Design

### Decision

The mobile app will use backend-issued session credentials only. It will not use a Supabase client session on-device after migration is complete.

### Required Backend Endpoints

- `POST /api/v1/auth/register/customer`
- `POST /api/v1/auth/register/provider`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

### Session Contract

The backend returns an app session payload with at least:

- `access_token`
- `refresh_token`
- `expires_at`
- `user`
- `role`

The mobile client stores backend tokens in secure storage and uses them for authenticated API requests.

### Backend Auth Responsibilities

- Validate credentials and provider status.
- Map user identity to internal profile data.
- Issue refreshable app tokens.
- Revoke or invalidate sessions on logout when supported.
- Orchestrate forgot-password and reset-password flows without requiring the mobile app to call Supabase auth APIs directly.

### Mobile Auth Responsibilities

- Replace `AuthContext` session derivation from Supabase with backend session bootstrap.
- Replace direct calls to `supabase.auth.signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`, `exchangeCodeForSession`, `setSession`, and `updateUser`.
- Update guarded navigation and user bootstrapping to depend on `GET /auth/me` or the stored app session payload.

## Capability Migration Design

### 1. Profiles and Addresses

Move all profile and address reads and writes behind backend endpoints. Mobile screens should consume backend DTOs instead of querying `identity_svc` directly or mixing direct queries with API calls.

Expected backend capabilities:

- current user profile fetch
- customer profile update
- provider profile update
- address list fetch
- address create, update, delete
- default address selection behavior

### 2. Provider Catalog and Availability

Provider discovery, provider service selection, pricing configuration, and availability management should all be served by backend endpoints.

Expected backend capabilities:

- provider discovery list
- provider detail
- provider services list
- provider pricing management
- provider availability read and write
- service taxonomy and category reference data

### 3. Booking and Payments

Bookings already partially use API routes, but direct supporting reads still exist. The backend should own the full booking contract, including all supporting joins and status projections.

Expected backend capabilities:

- booking create
- booking detail
- booking list for customer and provider
- booking cancel and provider actions
- booking attachments
- payment method metadata
- provider earnings summaries

### 4. Chat and Notifications

Chat and notifications currently rely on direct schema access and realtime behavior. The first API migration target is behavior parity through request-response endpoints. Push or stream enhancements can follow later.

Expected backend capabilities:

- conversation list
- thread fetch
- send message
- mark thread read
- notification list
- notification mark read
- unread counts

Initial parity approach:

- mobile polls for updates at bounded intervals
- backend computes unread counts and thread summaries

Future enhancement, out of first migration scope:

- SSE or websocket delivery behind the backend

### 5. Uploads and Media

All file uploads should move behind backend endpoints that validate file type, size, ownership, and target entity before storing in Supabase buckets.

Expected backend capabilities:

- avatar upload
- booking attachment upload
- provider verification document upload

The mobile app should no longer upload directly to Supabase storage buckets.

## API Contract Principles

- Backend DTOs are the only supported mobile contract.
- Response shapes should be normalized and stable.
- Cross-schema aggregation happens in backend services, not on the device.
- Missing optional data must have explicit fallback behavior.
- Mutating endpoints should be idempotent where double-submit risk exists.
- Backend errors should be standardized so the mobile app can map them consistently.

## Cross-Screen and Cross-Layer Contract Changes

The migration will change shared contracts across multiple layers. These changes must be tracked explicitly during implementation and review.

Examples:

- auth route payloads and secure storage keys
- route params currently relying on directly fetched Supabase rows
- DTOs used by booking, chat, notification, and profile screens
- fallback behavior when data is incomplete or delayed
- upload response payloads and file metadata expectations

## Risks

### High Risk

- Auth migration because current mobile state is coupled to Supabase session semantics.
- Password reset because current deep-link handling assumes Supabase callback mechanics.
- Chat and notifications because current behavior includes direct reads and near-realtime updates.
- Upload flows because storage ownership and file validation move to the backend.

### Medium Risk

- Screen regressions caused by DTO shape drift.
- Loss of convenience from direct schema reads during incremental migration.
- Increased backend aggregation complexity for some screens.

## Rollout Plan

### Phase 1: Auth Foundation

- add missing auth endpoints
- add refresh and me endpoints
- create backend session model
- replace mobile auth context and secure storage usage

### Phase 2: Identity Slice

- migrate profile and address flows
- remove direct identity schema reads and writes from mobile

### Phase 3: Catalog Slice

- migrate provider services, taxonomy, pricing, and availability

### Phase 4: Booking and Payment Slice

- finish booking-related supporting reads through backend contracts
- keep behavior parity for customer and provider booking screens

### Phase 5: Chat and Notification Slice

- introduce polling-backed APIs for parity
- remove direct conversation, message, and notification table access

### Phase 6: Upload Slice

- migrate avatar, booking attachment, and verification document uploads

### Phase 7: Cleanup

- remove remaining direct runtime Supabase usage from mobile
- prune dead helpers, old session code, and unused schema client imports
- update docs and tests

## Acceptance Criteria

- Mobile runtime no longer depends on `supabase.auth`.
- Mobile runtime no longer performs direct `.from(...)` queries against Supabase schemas.
- Mobile runtime no longer uploads directly to Supabase storage.
- Mobile runtime no longer subscribes directly to Supabase channels.
- Login, signup, logout, forgot-password, and reset-password work through backend endpoints only.
- Core customer and provider flows continue to function with backend-served DTOs.
- Repo search confirms direct Supabase runtime usage is removed from mobile application code except for any temporary migration shims explicitly documented during rollout.

## Verification Plan

### Backend

- unit tests for auth and each migrated service slice
- e2e coverage for auth lifecycle, booking lifecycle, uploads, chat send/fetch, and notifications

### Mobile

- update tests to mock backend API responses instead of Supabase auth/session behavior
- smoke-test auth boot, guarded routing, booking flows, provider flows, and chat inbox/thread flows

### Repository Audit

- grep for `supabase.auth`, `.from(`, `supabase.storage`, and `supabase.channel(` in mobile runtime code
- verify any remaining hits are test-only or explicitly approved migration shims

## Implementation Notes

- Keep migration changes scoped by capability instead of refactoring unrelated screens.
- Preserve current behavior first, then improve contracts after parity is reached.
- If a capability depends on multiple direct Supabase reads today, prefer one backend aggregate DTO rather than reproducing the same orchestration in multiple mobile screens.
- Document contract changes for every slice before Gemini review so the review can validate full cross-screen flows.
