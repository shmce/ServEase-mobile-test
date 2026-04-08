# Admin Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded mock data and fake auth in the admin app with real NestJS backend calls, using a central `adminApi.ts` module with typed stubs for endpoints not yet built.

**Architecture:** A single `src/lib/adminApi.ts` handles all network calls — two real endpoints (login, document status update) and five typed stubs returning `null`. `AuthContext` calls `adminApi.adminLogin()` and stores the JWT. `DataContext` calls all data-fetching stubs via `useEffect` and shows empty state until real endpoints are wired in.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5.7, `fetch` (native), `sonner` for toasts. No new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `desktop/apps/admin/.env.local` | Backend URL config |
| Create | `desktop/apps/admin/src/lib/adminApi.ts` | All backend calls + stubs |
| Modify | `desktop/apps/admin/src/app/contexts/AuthContext.tsx` | Real login via API, JWT storage |
| Modify | `desktop/apps/admin/src/app/login/page.tsx` | Remove demo credentials UI block |
| Modify | `desktop/apps/admin/src/contexts/DataContext.tsx` | Async data fetch, inline helpers |
| Modify | `desktop/apps/admin/src/app/pages/ProviderApplicationReview.tsx` | Wire approve/reject to real endpoint |
| Delete | `desktop/apps/admin/src/services/dataStore.ts` | Removed entirely |

---

## Task 1: Create `.env.local`

**Files:**
- Create: `desktop/apps/admin/.env.local`

- [ ] **Step 1: Create the env file**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Save as `desktop/apps/admin/.env.local`.

- [ ] **Step 2: Verify `.env.local` is gitignored**

Run from repo root:
```bash
cat desktop/apps/admin/.gitignore | grep env
```
Expected: `.env*.local` or `.env.local` appears. If not, add `.env.local` to `desktop/apps/admin/.gitignore`.

- [ ] **Step 3: Commit**

```bash
git add desktop/apps/admin/.gitignore
git commit -m "chore(admin): add .env.local for backend URL config"
```

---

## Task 2: Create `src/lib/adminApi.ts`

**Files:**
- Create: `desktop/apps/admin/src/lib/adminApi.ts`

- [ ] **Step 1: Create the file**

```typescript
// desktop/apps/admin/src/lib/adminApi.ts

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '') + '/api';

const TOKEN_KEY = 'servease_admin_token';

// ─── Token helpers ─────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let message = `Request failed: ${res.status}`;
  try {
    const body = await res.json();
    message = (body as { message?: string })?.message ?? message;
  } catch {
    // ignore parse error, use default message
  }
  throw new Error(message);
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AdminLoginResult {
  admin: { id: string; name: string; email: string; role: string };
  token: string;
}

export interface UpdateDocStatusDto {
  status: 'approved' | 'rejected';
  reject_reason?: string;
  admin_id?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeProviders: number;
  activeCustomers: number;
  completionRate: number;
  avgBookingValue: number;
}

export interface ProviderApplication {
  applicationId: string;
  businessName: string;
  ownerName: string;
  category: string;
  dateApplied: string;
  location: string;
  status: string;
  documentId: string;
}

export interface AdminProvider {
  id: string;
  businessName: string;
  categoryId: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  joinedDate: string;
  location: string;
  totalRevenue: number;
  totalEarnings: number;
}

export interface AdminBooking {
  id: string;
  customerId: string;
  providerId: string;
  categoryId: string;
  serviceDescription: string;
  scheduledDate: string;
  completedDate?: string;
  amount: number;
  commissionAmount: number;
  providerEarnings: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  location: string;
  createdAt: string;
}

export interface AdminTransaction {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  commissionAmount: number;
  providerEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminLoginResult> {
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });

  const data = await handleResponse<{
    access_token: string;
    role: string;
    user: {
      id: string;
      email: string;
      role: string;
      user_metadata: { full_name: string };
    };
  }>(res);

  if (data.role !== 'admin') {
    throw new Error('Access denied: not an admin account.');
  }

  return {
    admin: {
      id: data.user.id,
      name: data.user.user_metadata.full_name,
      email: data.user.email,
      role: data.role,
    },
    token: data.access_token,
  };
}

// ─── KYC Documents ─────────────────────────────────────────────────────────

export async function updateDocumentStatus(
  documentId: string,
  dto: UpdateDocStatusDto,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/v2/admin/documents/status/${documentId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(dto),
  });
  await handleResponse<unknown>(res);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

// TODO: Backend endpoint needed — GET /api/v1/admin/dashboard/stats
// Expected response shape: DashboardStats
export async function getDashboardStats(): Promise<DashboardStats | null> {
  return null;
}

// ─── Provider Applications ─────────────────────────────────────────────────

// TODO: Backend endpoint needed — GET /api/v1/admin/provider-applications
// Expected response shape: ProviderApplication[]
export async function getProviderApplications(): Promise<ProviderApplication[] | null> {
  return null;
}

// ─── Service Providers ─────────────────────────────────────────────────────

// TODO: Backend endpoint needed — GET /api/v1/admin/providers
// Expected response shape: AdminProvider[]
export async function getProviders(): Promise<AdminProvider[] | null> {
  return null;
}

// ─── Bookings ──────────────────────────────────────────────────────────────

// TODO: Backend endpoint needed — GET /api/v1/admin/bookings
// Expected response shape: AdminBooking[]
export async function getBookings(): Promise<AdminBooking[] | null> {
  return null;
}

// ─── Transactions ──────────────────────────────────────────────────────────

// TODO: Backend endpoint needed — GET /api/v1/admin/transactions
// Expected response shape: AdminTransaction[]
export async function getTransactions(): Promise<AdminTransaction[] | null> {
  return null;
}
```

- [ ] **Step 2: Type-check**

```bash
cd "desktop/apps/admin" && npx tsc --noEmit
```

Expected: No errors. If errors appear, fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add desktop/apps/admin/src/lib/adminApi.ts
git commit -m "feat(admin): add adminApi module with real auth/KYC endpoints and stubs"
```

---

## Task 3: Update `AuthContext.tsx` and remove demo credentials from login page

**Files:**
- Modify: `desktop/apps/admin/src/app/contexts/AuthContext.tsx`
- Modify: `desktop/apps/admin/src/app/login/page.tsx`

- [ ] **Step 1: Replace `AuthContext.tsx` entirely**

```typescript
// desktop/apps/admin/src/app/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { adminLogin, storeToken, clearToken } from "../../lib/adminApi";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("servease_admin");
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem("servease_admin");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await adminLogin(email, password);
      setAdmin(result.admin);
      localStorage.setItem("servease_admin", JSON.stringify(result.admin));
      storeToken(result.token);
      setSessionExpired(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("servease_admin");
    clearToken();
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 2: Remove the demo credentials block from `login/page.tsx`**

Find and delete this entire block (lines ~289–301 in `src/app/login/page.tsx`):

```tsx
              {/* Demo Credentials Helper */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials</p>
                <div className="p-4 bg-gray-50 rounded-xl space-y-1 text-xs font-mono border border-gray-100">
                  <p className="text-gray-700">
                    <span className="text-gray-500">Email:</span> juan@servease.ph
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Password:</span> admin123
                  </p>
                </div>
              </div>
```

- [ ] **Step 3: Type-check**

```bash
cd "desktop/apps/admin" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add desktop/apps/admin/src/app/contexts/AuthContext.tsx desktop/apps/admin/src/app/login/page.tsx
git commit -m "feat(admin): wire auth to real login endpoint, remove demo credentials"
```

---

## Task 4: Rewrite `DataContext.tsx`

**Files:**
- Modify: `desktop/apps/admin/src/contexts/DataContext.tsx`

- [ ] **Step 1: Replace `DataContext.tsx` entirely**

```typescript
// desktop/apps/admin/src/contexts/DataContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import * as adminApi from "../lib/adminApi";
import {
  ServiceCategory,
  ServiceProvider,
  Customer,
  Booking,
  Transaction,
  PayoutRequest,
  Dispute,
  Refund,
  AdminUser,
  AuditLog,
  DashboardStats,
  ProviderEarning,
  BookingStatus,
  ProviderStatus,
  PaymentStatus,
  PaymentMethod,
} from "../types";

interface DataContextType {
  // Data
  serviceCategories: ServiceCategory[];
  serviceProviders: ServiceProvider[];
  customers: Customer[];
  bookings: Booking[];
  transactions: Transaction[];
  payoutRequests: PayoutRequest[];
  disputes: Dispute[];
  refunds: Refund[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Computed
  dashboardStats: DashboardStats;

  // Helpers
  getCustomerById: (id: string) => Customer | undefined;
  getProviderById: (id: string) => ServiceProvider | undefined;
  getCategoryById: (id: string) => ServiceCategory | undefined;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByCustomer: (customerId: string) => Booking[];
  getBookingsByProvider: (providerId: string) => Booking[];
  getTransactionsByProvider: (providerId: string) => Transaction[];
  calculateProviderEarnings: (providerId: string) => ProviderEarning;

  // Actions
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  approveRefund: (refundId: string) => void;
  rejectRefund: (refundId: string, reason: string) => void;
  updateProviderStatus: (providerId: string, status: ProviderStatus) => void;
  approvePayoutRequest: (payoutId: string) => void;
  updateCommissionRate: (categoryId: string, newRate: number) => void;
  addAuditLog: (action: string, userId: string, details: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [customers] = useState<Customer[]>([]); // TODO: fetch when GET /api/v1/admin/customers exists
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]); // TODO: fetch when GET /api/v1/admin/payout-requests exists
  const [disputes] = useState<Dispute[]>([]); // TODO: fetch when GET /api/v1/admin/disputes exists
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [adminUsers] = useState<AdminUser[]>([]); // TODO: fetch when GET /api/v1/admin/users exists
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const [providers, bookingData, txData] = await Promise.all([
          adminApi.getProviders(),
          adminApi.getBookings(),
          adminApi.getTransactions(),
        ]);

        if (providers) {
          setServiceProviders(
            providers.map((p) => ({
              id: p.id,
              businessName: p.businessName,
              categoryId: p.categoryId,
              contactPerson: p.contactPerson,
              email: p.email,
              phone: p.phone,
              status: p.status as ProviderStatus,
              rating: p.rating,
              totalBookings: p.totalBookings,
              completedBookings: p.completedBookings,
              cancelledBookings: p.cancelledBookings,
              completionRate: p.completionRate,
              joinedDate: p.joinedDate,
              location: p.location,
              totalRevenue: p.totalRevenue,
              totalEarnings: p.totalEarnings,
            })),
          );
        }

        if (bookingData) {
          setBookings(
            bookingData.map((b) => ({
              id: b.id,
              customerId: b.customerId,
              providerId: b.providerId,
              categoryId: b.categoryId,
              serviceDescription: b.serviceDescription,
              scheduledDate: b.scheduledDate,
              completedDate: b.completedDate,
              amount: b.amount,
              commissionAmount: b.commissionAmount,
              providerEarnings: b.providerEarnings,
              status: b.status as BookingStatus,
              paymentStatus: b.paymentStatus as PaymentStatus,
              paymentMethod: b.paymentMethod as PaymentMethod,
              location: b.location,
              createdAt: b.createdAt,
            })),
          );
        }

        if (txData) {
          setTransactions(
            txData.map((t) => ({
              id: t.id,
              bookingId: t.bookingId,
              customerId: t.customerId,
              providerId: t.providerId,
              amount: t.amount,
              commissionAmount: t.commissionAmount,
              providerEarnings: t.providerEarnings,
              paymentMethod: t.paymentMethod as PaymentMethod,
              paymentStatus: t.paymentStatus as PaymentStatus,
              timestamp: t.timestamp,
            })),
          );
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ── Computed dashboard stats ───────────────────────────────────────────────
  const dashboardStats: DashboardStats = {
    totalRevenue: bookings
      .filter((b) => b.status === "Completed" && b.paymentStatus === "Paid")
      .reduce((sum, b) => sum + b.amount, 0),
    totalBookings: bookings.length,
    activeProviders: serviceProviders.filter((p) => p.status === "Active").length,
    activeCustomers: customers.filter((c) => c.status === "Active").length,
    completionRate:
      bookings.length > 0
        ? (bookings.filter((b) => b.status === "Completed").length / bookings.length) * 100
        : 0,
    avgBookingValue:
      bookings.length > 0
        ? bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length
        : 0,
  };

  // ── Helper functions ───────────────────────────────────────────────────────
  const getCustomerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  );

  const getProviderById = useCallback(
    (id: string) => serviceProviders.find((p) => p.id === id),
    [serviceProviders],
  );

  const getCategoryById = useCallback(
    (id: string) => serviceCategories.find((c) => c.id === id),
    [serviceCategories],
  );

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );

  const getBookingsByCustomer = useCallback(
    (customerId: string) => bookings.filter((b) => b.customerId === customerId),
    [bookings],
  );

  const getBookingsByProvider = useCallback(
    (providerId: string) => bookings.filter((b) => b.providerId === providerId),
    [bookings],
  );

  const getTransactionsByProvider = useCallback(
    (providerId: string) => transactions.filter((t) => t.providerId === providerId),
    [transactions],
  );

  const calculateProviderEarnings = useCallback(
    (providerId: string): ProviderEarning => {
      const providerBookings = bookings.filter((b) => b.providerId === providerId);
      const completedBookings = providerBookings.filter((b) => b.status === "Completed");
      const paidBookings = completedBookings.filter((b) => b.paymentStatus === "Paid");
      const pendingEarningsBookings = completedBookings.filter(
        (b) => b.paymentStatus === "Pending",
      );
      const totalEarnings = paidBookings.reduce((sum, b) => sum + b.providerEarnings, 0);
      const pendingEarnings = pendingEarningsBookings.reduce(
        (sum, b) => sum + b.providerEarnings,
        0,
      );
      const releasedPayouts = payoutRequests.filter(
        (p) => p.providerId === providerId && p.status === "Released",
      );
      const lastPayout =
        releasedPayouts.length > 0 ? releasedPayouts[releasedPayouts.length - 1] : undefined;
      return {
        providerId,
        totalEarnings,
        pendingEarnings,
        paidEarnings: totalEarnings - pendingEarnings,
        totalBookings: providerBookings.length,
        completedBookings: completedBookings.length,
        lastPayoutDate: lastPayout?.processedDate,
      };
    },
    [bookings, payoutRequests],
  );

  // ── Mutation actions (local state only — each needs a backend call) ─────────

  // TODO: updateBookingStatus → PATCH /api/v1/admin/bookings/:id/status
  const updateBookingStatus = useCallback(
    (bookingId: string, status: BookingStatus) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status,
                completedDate:
                  status === "Completed" ? new Date().toISOString() : booking.completedDate,
              }
            : booking,
        ),
      );
      if (status === "Completed") {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          setTransactions((prev) => [
            ...prev,
            {
              id: `TXN-${Date.now()}`,
              bookingId: booking.id,
              customerId: booking.customerId,
              providerId: booking.providerId,
              amount: booking.amount,
              commissionAmount: booking.commissionAmount,
              providerEarnings: booking.providerEarnings,
              paymentMethod: booking.paymentMethod,
              paymentStatus: booking.paymentStatus,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    },
    [bookings],
  );

  // TODO: approveRefund → PATCH /api/v1/admin/refunds/:id/approve
  const approveRefund = useCallback(
    (refundId: string) => {
      setRefunds((prev) =>
        prev.map((refund) =>
          refund.id === refundId
            ? { ...refund, status: "Approved" as const, processedDate: new Date().toISOString() }
            : refund,
        ),
      );
      const refund = refunds.find((r) => r.id === refundId);
      if (refund) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === refund.bookingId
              ? { ...booking, paymentStatus: "Refunded" as const }
              : booking,
          ),
        );
      }
    },
    [refunds],
  );

  // TODO: rejectRefund → PATCH /api/v1/admin/refunds/:id/reject
  const rejectRefund = useCallback((_refundId: string, _reason: string) => {
    setRefunds((prev) =>
      prev.map((refund) =>
        refund.id === _refundId
          ? { ...refund, status: "Rejected" as const, processedDate: new Date().toISOString() }
          : refund,
      ),
    );
  }, []);

  // TODO: updateProviderStatus → PATCH /api/v1/admin/providers/:id/status
  const updateProviderStatus = useCallback((providerId: string, status: ProviderStatus) => {
    setServiceProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, status } : provider,
      ),
    );
  }, []);

  // TODO: approvePayoutRequest → PATCH /api/v1/admin/payout-requests/:id/approve
  const approvePayoutRequest = useCallback((payoutId: string) => {
    setPayoutRequests((prev) =>
      prev.map((payout) =>
        payout.id === payoutId
          ? { ...payout, status: "Approved" as const, processedDate: new Date().toISOString() }
          : payout,
      ),
    );
  }, []);

  // TODO: updateCommissionRate → PATCH /api/v1/admin/categories/:id/commission
  const updateCommissionRate = useCallback((categoryId: string, newRate: number) => {
    setServiceCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, commissionRate: newRate } : category,
      ),
    );
  }, []);

  // TODO: addAuditLog → POST /api/v1/admin/audit-logs
  const addAuditLog = useCallback((action: string, userId: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: "192.168.1.1",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  const value: DataContextType = {
    serviceCategories,
    serviceProviders,
    customers,
    bookings,
    transactions,
    payoutRequests,
    disputes,
    refunds,
    adminUsers,
    auditLogs,
    isLoading,
    error,
    dashboardStats,
    getCustomerById,
    getProviderById,
    getCategoryById,
    getBookingById,
    getBookingsByCustomer,
    getBookingsByProvider,
    getTransactionsByProvider,
    calculateProviderEarnings,
    updateBookingStatus,
    approveRefund,
    rejectRefund,
    updateProviderStatus,
    approvePayoutRequest,
    updateCommissionRate,
    addAuditLog,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
```

- [ ] **Step 2: Type-check**

```bash
cd "desktop/apps/admin" && npx tsc --noEmit
```

Expected: No errors. Common error to watch for: `PayoutStatus` type — `"Released"` must be a valid `PayoutStatus`. Check `src/types/index.ts`. If `"Released"` is missing from the union, the filter will still work (it just won't match), but fix the type if it errors.

- [ ] **Step 3: Commit**

```bash
git add desktop/apps/admin/src/contexts/DataContext.tsx
git commit -m "feat(admin): replace dataStore mock with async API calls in DataContext"
```

---

## Task 5: Wire approve/reject in `ProviderApplicationReview.tsx`

**Files:**
- Modify: `desktop/apps/admin/src/app/pages/ProviderApplicationReview.tsx`

- [ ] **Step 1: Add `documentId` to `buildApplication` mock data**

The `buildApplication` function (line ~61) needs a `documentId` field. This is a placeholder UUID until the real applications API exists.

Change the function signature and body — add `documentId` as a derived field:

```typescript
const buildApplication = (
  applicationId: string,
  businessName: string,
  ownerName: string,
  category: string,
  dateApplied: string,
  location: string,
  riskLevel: "low" | "medium" | "high",
  flags: string[],
  providerType: "Company" | "Individual",
  businessDescription: string,
  businessType: "Physical Location" | "Online Business",
  businessAddress: { street: string; barangay: string; city: string },
  contactPhone: string,
  contactEmail: string
) => ({
  applicationId,
  businessName,
  ownerName,
  category,
  dateApplied,
  location,
  riskLevel,
  flags,
  // TODO: Replace with real document UUID from GET /api/v1/admin/provider-applications/:id
  documentId: "00000000-0000-0000-0000-" + applicationId.replace(/\D/g, "").padStart(12, "0"),
  govIdNumber: "PSN-2026-" + applicationId.slice(-4),
  ocrConfidence: 92,
  govIdType: "PhilSys National ID",
  notes: [
    {
      id: 1,
      text: "Application received and queued for manual review.",
      author: "System",
      timestamp: dateApplied + " 09:00 AM",
    },
    {
      id: 2,
      text: "Forwarded to senior verifier for flag assessment.",
      author: "Admin User",
      timestamp: dateApplied + " 10:30 AM",
    },
  ],
  providerType,
  businessDescription,
  businessType,
  businessAddress,
  contactPhone,
  contactEmail,
});
```

- [ ] **Step 2: Add imports for `updateDocumentStatus`, `useAuth`, and `toast`**

At the top of the file, add these three imports alongside the existing ones:

```typescript
import { updateDocumentStatus } from "../../lib/adminApi";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
```

- [ ] **Step 3: Add `useAuth` call and `isSubmitting` state inside the component**

Inside `ProviderApplicationReview` (after the existing `useState` declarations), add:

```typescript
const { admin } = useAuth();
const [isSubmitting, setIsSubmitting] = useState(false);
```

- [ ] **Step 4: Replace the approve confirm button `onClick` handler**

Find (line ~1131–1136):
```tsx
            <Button
              className="bg-[#16A34A] hover:bg-[#15803D] gap-2"
              onClick={() => { setShowApproveModal(false); navigate("/provider-applications"); }}
            >
              <CheckCircle className="w-4 h-4" />Confirm Approval
            </Button>
```

Replace with:
```tsx
            <Button
              className="bg-[#16A34A] hover:bg-[#15803D] gap-2"
              disabled={isSubmitting}
              onClick={async () => {
                if (!application) return;
                setIsSubmitting(true);
                try {
                  await updateDocumentStatus(application.documentId, {
                    status: "approved",
                    admin_id: admin?.id,
                  });
                  setShowApproveModal(false);
                  navigate("/provider-applications");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Approval
            </Button>
```

- [ ] **Step 5: Replace the reject confirm button `onClick` handler**

Find (line ~1165–1173):
```tsx
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() => { setShowRejectModal(false); navigate("/provider-applications"); }}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />Confirm Rejection
            </Button>
```

Replace with:
```tsx
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || isSubmitting}
              onClick={async () => {
                if (!application) return;
                setIsSubmitting(true);
                try {
                  await updateDocumentStatus(application.documentId, {
                    status: "rejected",
                    reject_reason: rejectionReason,
                    admin_id: admin?.id,
                  });
                  setShowRejectModal(false);
                  navigate("/provider-applications");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Confirm Rejection
            </Button>
```

- [ ] **Step 6: Add TODO comment above the mock data block**

Above line 60 (`/* ─── MOCK DATA ─── */`), add:

```typescript
// TODO: Replace mockApplications with GET /api/v1/admin/provider-applications/:id
// The documentId field currently uses a placeholder UUID derived from applicationId.
// Once the real endpoint exists, documentId will be the actual provider_documents UUID.
```

- [ ] **Step 7: Type-check**

```bash
cd "desktop/apps/admin" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add desktop/apps/admin/src/app/pages/ProviderApplicationReview.tsx
git commit -m "feat(admin): wire approve/reject KYC actions to real backend endpoint"
```

---

## Task 6: Delete `dataStore.ts` and final type check

**Files:**
- Delete: `desktop/apps/admin/src/services/dataStore.ts`

- [ ] **Step 1: Delete the file**

```bash
rm "desktop/apps/admin/src/services/dataStore.ts"
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "dataStore" desktop/apps/admin/src --include="*.ts" --include="*.tsx"
```

Expected: No output. If any files still import from `dataStore`, fix them before proceeding.

- [ ] **Step 3: Final type-check**

```bash
cd "desktop/apps/admin" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add -A desktop/apps/admin/src/services/dataStore.ts
git commit -m "chore(admin): delete dataStore mock — replaced by adminApi stubs"
```

---

## Self-Review Notes

- `PayoutStatus` in `src/types/index.ts` defines `"Pending" | "Approved" | "Released" | "Rejected"` — `"Released"` is present, so the `calculateProviderEarnings` filter is valid.
- `DataContext` no longer imports from `dataStore` — deleting the file will not cause any import errors.
- `ProviderApplicationReview` uses `RefreshCw` for the loading spinner — it is already imported in that file (line ~35).
- `adminLogin` sends `identifier` (not `email`) in the POST body — matches the backend `LoginUserDto` which accepts either email or phone as `identifier`.
- The `admin_id` passed to `updateDocumentStatus` is `admin?.id` from `useAuth()`. The backend field is a UUID — this will only work once real Supabase users are in the admin role; it is safe to pass `undefined` (field is optional in the DTO).
