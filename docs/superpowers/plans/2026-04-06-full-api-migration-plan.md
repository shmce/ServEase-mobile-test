# Full API Migration - Implementation Plan

## 1. Objective
Migrate the mobile app to an API-only runtime model where all auth, data, uploads, and messaging go through the NestJS backend. Remove direct mobile Supabase usage in controlled slices while preserving current customer and provider behavior.

## 2. Tech Strategy
- **Pattern:** Strangler migration by capability with backend-owned contracts
- **State:** Backend session tokens in mobile secure storage; backend DTOs as the only runtime contract
- **Constraints:** No big-bang cutover, no unrelated refactors, keep Supabase as backend infrastructure only

## 3. Blast Radius
- **High risk features:** login, signup, logout, forgot/reset password, auth boot, chat, notifications, uploads
- **Coupled mobile areas:** `mobile/context/`, `mobile/lib/`, `mobile/services/`, auth screens, booking screens, provider flows
- **Coupled backend areas:** `backend/src/modules/auth/`, profile-related modules, booking, provider, addresses, reference, payments
- **Tests likely impacted:** mobile auth/session tests, booking service tests, marketplace tests, backend auth tests, backend e2e coverage

## 4. File Changes
| Action | File Path | Brief Purpose |
|:--|:--|:--|
| MOD | `backend/src/modules/auth/auth.controller.ts` | Add missing auth endpoints and version alignment |
| MOD | `backend/src/modules/auth/auth.service.ts` | Backend-owned login, refresh, me, forgot/reset, logout |
| NEW | `backend/src/modules/auth/dto/*.ts` | Session, refresh, forgot/reset password DTOs |
| NEW | `backend/src/modules/auth/guards/*` | App token validation for migrated endpoints |
| MOD | `backend/src/modules/users/*` | Support backend-owned current user/profile fetch |
| MOD | `backend/src/modules/addresses/*` | Ensure full address CRUD and default behavior via API |
| MOD | `backend/src/modules/provider/*` | Provider detail, pricing, profile, availability aggregation |
| MOD | `backend/src/modules/services/*` | Category and service reference endpoints for mobile |
| MOD | `backend/src/modules/booking/*` | Complete booking aggregate DTOs and attachment flows |
| MOD | `backend/src/modules/payments/*` | Payment metadata and provider earnings endpoints |
| NEW | `backend/src/modules/chat/*` | Conversation, thread, send, read, unread endpoints |
| NEW | `backend/src/modules/notifications/*` | Notification list, read, unread endpoints |
| NEW | `backend/src/modules/uploads/*` | Avatar and attachment upload endpoints |
| MOD | `backend/test/app.e2e-spec.ts` | Expand end-to-end coverage for migrated slices |
| MOD | `mobile/lib/apiClient.ts` | Backend token auth, refresh handling, session bootstrap support |
| MOD | `mobile/context/AuthContext.tsx` | Remove Supabase session ownership; use backend session/me |
| MOD | `mobile/lib/customer-session.ts` | Replace direct Supabase auth calls with backend auth services |
| MOD | `mobile/lib/supabase.ts` | Deprecate runtime usage, retain only until final cleanup if needed |
| MOD | `mobile/lib/db.ts` | Remove runtime schema access after slice migration |
| MOD | `mobile/services/*.ts` | Convert remaining direct Supabase reads/writes to API calls |
| MOD | `mobile/src/features/auth/screens/*.tsx` | Use backend auth endpoints for login/signup/reset/logout |
| MOD | `mobile/app/**/*.tsx` | Replace direct schema queries and uploads with service calls |
| MOD | `mobile/context/__tests__/AuthContext.test.tsx` | Rebase auth tests onto backend session model |
| MOD | `mobile/services/__tests__/*.test.ts` | Rebase service tests onto API contracts |
| MOD | `docs/superpowers/specs/2026-04-06-full-api-migration-design.md` | Keep contract notes current if scope shifts |

## 5. Execution Sequence
1. **Auth foundation:** Add backend session endpoints, token validation, forgot/reset flows, and `GET /auth/me`.
2. **Mobile auth rewrite:** Move `AuthContext`, secure storage, signup/login/logout/reset flows to backend session contracts only.
3. **Identity slice:** Finish profile and address endpoints, migrate related mobile services and screens, remove identity schema reads.
4. **Catalog slice:** Add provider services, taxonomy, pricing, and availability APIs; migrate provider discovery and booking-form dependencies.
5. **Booking slice:** Complete booking aggregate DTOs, attachment endpoints, customer/provider booking detail dependencies, and payment metadata reads.
6. **Chat and notifications:** Add polling-friendly conversation/thread/notification endpoints and migrate inbox, thread, and unread state.
7. **Uploads:** Move avatar, booking attachment, and provider verification uploads behind backend endpoints.
8. **Cleanup:** Remove remaining `supabase.auth`, schema `.from(...)`, storage, and channel runtime usage from mobile; delete dead helpers and shims.

## 6. Contract Change Log Requirements
- Record auth payload changes, secure storage keys, and token expiry behavior.
- Record route params that were previously assembled from direct Supabase reads.
- Record DTO changes for booking, chat, notification, profile, and provider flows.
- Record missing-data fallback behavior for every migrated screen path.

## 7. Verification Standards
- [ ] Backend auth endpoints covered by unit tests and e2e login/refresh/me/reset flows
- [ ] Mobile auth boot works without `supabase.auth`
- [ ] Address, profile, provider discovery, booking, and provider workflow screens load from backend DTOs only
- [ ] Chat and notifications function through backend endpoints with unread counts verified
- [ ] Upload flows validate file ownership, type, and size through backend endpoints
- [ ] `rg -n "supabase\\.auth|\\.from\\(|supabase\\.storage|supabase\\.channel\\(" mobile` returns only approved test-only or shim-only hits during transition
- [ ] Final cleanup removes all non-test runtime hits from mobile

## 8. Recommended Delivery Slices
1. Auth + mobile session rewrite
2. Profiles + addresses
3. Provider catalog + availability
4. Booking + payments
5. Chat + notifications
6. Uploads + cleanup
