# Admin Backend Integration — Design Spec

**Date:** 2026-04-09  
**Scope:** `desktop/apps/admin/`  
**Status:** Approved

---

## Goal

Replace all mock data and hardcoded auth in the admin app with real backend calls, following a central API module pattern. Where backend endpoints don't yet exist, leave typed stub functions that return `null` and carry explicit `TODO` comments naming the required endpoint. Pages render empty state when stubs are active and populate automatically once real endpoints are wired in.

---

## Files Changed

| Action | Path |
|--------|------|
| Create | `desktop/apps/admin/src/lib/adminApi.ts` |
| Create | `desktop/apps/admin/.env.local` |
| Modify | `desktop/apps/admin/src/app/contexts/AuthContext.tsx` |
| Modify | `desktop/apps/admin/src/contexts/DataContext.tsx` |
| Modify | `desktop/apps/admin/src/app/pages/ProviderApplicationReview.tsx` |
| Delete | `desktop/apps/admin/src/services/dataStore.ts` |

---

## Environment

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The backend runs on port 4000 (`backend/.env` → `PORT=4000`). The admin Next.js dev server runs on port 3001 (`package.json` → `next dev -p 3001`). No port conflict.

---

## `src/lib/adminApi.ts`

Single module for all backend communication. Reads `NEXT_PUBLIC_API_URL` for the base URL. Reads the JWT from `localStorage` under `servease_admin_token` and injects `Authorization: Bearer <token>` on all authenticated requests. Throws `Error` with the backend's error message on non-2xx responses.

### Real endpoints

#### `adminLogin(email, password) → AdminLoginResult`
- `POST /api/v1/auth/login`
- Unauthenticated.
- On success: checks `data.user.db_role === 'admin'`; throws `"Access denied: not an admin account."` if role mismatch.
- Returns `{ admin: { id, name, email, role }, token }`.

#### `updateDocumentStatus(documentId, dto) → void`
- `PATCH /api/v2/admin/documents/status/:documentId`
- Authenticated.
- Body: `{ status: 'approved' | 'rejected', reject_reason?: string, admin_id?: string }`
- Used by the ProviderApplicationReview approve/reject flow.

### Stub functions (return `null`, no network call)

```
getDashboardStats()
  // TODO: Backend endpoint needed — GET /api/v1/admin/dashboard/stats
  // Expected shape: { totalRevenue, totalBookings, activeProviders,
  //                   activeCustomers, completionRate, avgBookingValue }

getProviderApplications()
  // TODO: Backend endpoint needed — GET /api/v1/admin/provider-applications
  // Expected shape: ProviderApplication[] (applicationId, businessName,
  //                 ownerName, category, dateApplied, location, status,
  //                 documentId)

getProviders()
  // TODO: Backend endpoint needed — GET /api/v1/admin/providers
  // Expected shape: ServiceProvider[] (id, businessName, categoryId,
  //                 contactPerson, email, phone, status, rating,
  //                 totalBookings, completedBookings, cancelledBookings,
  //                 completionRate, joinedDate, location, totalRevenue,
  //                 totalEarnings)

getBookings()
  // TODO: Backend endpoint needed — GET /api/v1/admin/bookings
  // Expected shape: Booking[] (id, customerId, providerId, categoryId,
  //                 serviceDescription, scheduledDate, completedDate?,
  //                 amount, commissionAmount, providerEarnings, status,
  //                 paymentStatus, paymentMethod, location, createdAt)

getTransactions()
  // TODO: Backend endpoint needed — GET /api/v1/admin/transactions
  // Expected shape: Transaction[] (id, bookingId, customerId, providerId,
  //                 amount, commissionAmount, providerEarnings,
  //                 paymentMethod, paymentStatus, timestamp)
```

---

## `AuthContext.tsx`

### Changes
- `login()` calls `adminApi.adminLogin(email, password)` instead of the hardcoded comparison.
- On success: stores `admin` object in `localStorage` under `servease_admin` (existing key, no change) and stores JWT under `servease_admin_token`.
- On role mismatch or API error: returns `{ success: false, error: <message> }`.
- `logout()` also removes `servease_admin_token` from `localStorage`.
- The demo credentials block is removed from `AuthContext`. The demo credentials UI in `login/page.tsx` is also removed.

### `Admin` type (unchanged shape)
```ts
interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}
```
The backend login response maps: `id` ← `data.user.id`, `name` ← `data.user.full_name`, `email` ← `data.user.email`, `role` ← `data.user.db_role`.

---

## `DataContext.tsx`

### Changes
- Remove all `dataStore.*` static initializations.
- Each domain is fetched in a single `useEffect` on mount via the corresponding `adminApi.*` function.
- When a stub returns `null`, the domain array stays `[]` — empty state, no crash.
- When a real endpoint returns data, it populates normally.

### Loading and error state
Two new fields added to the context value:
```ts
isLoading: boolean   // true while any domain is still fetching
error: string | null // first error message encountered, or null
```

### Mutation actions (updateBookingStatus, approveRefund, etc.)
These currently mutate local state only. They are kept as-is for now — they become real API calls when the corresponding backend endpoints are built. A `// TODO:` comment is added above each one indicating what endpoint it needs.

### Helper functions (getCustomerById, getProviderById, etc.)
These filter from the in-memory arrays. They continue to work correctly — they just operate over live data from the API instead of mock data.

### `dataStore.ts` is deleted entirely.

---

## `ProviderApplicationReview.tsx`

### Approve / Reject wiring
- The approve and reject button handlers call `adminApi.updateDocumentStatus(documentId, dto)`.
- `documentId` is sourced from the application record. The page currently builds applications from inline mock data; a `// TODO:` comment marks where the `GET /api/v1/admin/provider-applications/:id` fetch will replace it.
- On success: show existing success toast, navigate back.
- On error: show error toast with the API error message; do not navigate.
- The approve/reject buttons show a loading spinner while the request is in flight.

---

## Data flow summary

```
Login page
  └─ AuthContext.login()
       └─ adminApi.adminLogin()  →  POST /api/v1/auth/login
            stores JWT → localStorage['servease_admin_token']

DataContext (mount)
  ├─ adminApi.getDashboardStats()     →  null (TODO)
  ├─ adminApi.getProviderApplications() → null (TODO)
  ├─ adminApi.getProviders()          →  null (TODO)
  ├─ adminApi.getBookings()           →  null (TODO)
  └─ adminApi.getTransactions()       →  null (TODO)

ProviderApplicationReview (approve/reject)
  └─ adminApi.updateDocumentStatus()  →  PATCH /api/v2/admin/documents/status/:id
```

---

## Out of scope

- Adding new backend endpoints (done separately when each page is built out).
- Pagination, search, or filtering at the API layer.
- Role-based access control within the admin app (all authenticated admins see everything).
- The placeholder pages beyond Dashboard, Provider Applications, Service Providers, Bookings, Transactions.
