import type {
  AdminUser,
  AuditLog,
  Booking,
  Customer,
  Dispute,
  PayoutRequest,
  Refund,
  ServiceCategory,
  ServiceProvider,
  Transaction,
} from "../types";

const DEFAULT_API_BASE_URL = "http://localhost:5000";

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
  return (configuredUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export class AdminApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface AdminSession {
  accessToken: string;
  refreshToken?: string;
  admin: AdminUser;
}

type ResponseRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ResponseRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function toArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ["items", "data", "results", "rows", "records"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function unwrapRecord<T>(payload: unknown): T {
  if (!isRecord(payload)) {
    return payload as T;
  }

  if (isRecord(payload.data) && !Array.isArray(payload.data)) {
    return payload.data as T;
  }

  return payload as T;
}

function normalizeStatus(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeAdminRole(value: unknown): AdminUser["role"] {
  const role = firstString(value);
  if (role === "Super Admin" || role === "Finance Manager" || role === "Support Manager") {
    return role;
  }
  return "Super Admin";
}

function normalizeCustomer(payload: unknown): Customer {
  const record = isRecord(payload) ? payload : {};
  const nestedUser = isRecord(record.user) ? record.user : {};
  const nestedProfile = isRecord(record.profile) ? record.profile : {};

  return {
    id: firstString(record.id, record.customer_id, record.user_id, nestedUser.id, nestedProfile.id),
    name: firstString(
      record.name,
      record.full_name,
      record.customer_name,
      nestedUser.full_name,
      nestedUser.name,
      nestedProfile.full_name
    ),
    email: firstString(record.email, nestedUser.email, nestedProfile.email),
    phone: firstString(record.phone, record.contact_number, nestedUser.contact_number, nestedProfile.contact_number),
    location: firstString(record.location, nestedProfile.location, record.address),
    memberSince: firstString(record.memberSince, record.member_since, record.created_at, nestedUser.created_at) || new Date().toISOString(),
    totalBookings: firstNumber(record.totalBookings, record.total_bookings, record.booking_count, record.bookings_count),
    totalSpent: firstNumber(record.totalSpent, record.total_spent, record.spent_amount),
    status: normalizeStatus(record.status, "Active") as Customer["status"],
  };
}

function normalizeServiceCategory(payload: unknown): ServiceCategory {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.category_id),
    name: firstString(record.name, record.category_name),
    commissionRate: firstNumber(record.commissionRate, record.commission_rate, record.rate),
  };
}

function normalizeServiceProvider(payload: unknown): ServiceProvider {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.provider_id, record.user_id),
    businessName: firstString(record.businessName, record.business_name, record.name),
    categoryId: firstString(record.categoryId, record.category_id),
    contactPerson: firstString(record.contactPerson, record.contact_person, record.owner_name),
    email: firstString(record.email),
    phone: firstString(record.phone, record.contact_number),
    status: normalizeStatus(record.status, "Active") as ServiceProvider["status"],
    rating: firstNumber(record.rating, record.average_rating),
    totalBookings: firstNumber(record.totalBookings, record.total_bookings),
    completedBookings: firstNumber(record.completedBookings, record.completed_bookings),
    cancelledBookings: firstNumber(record.cancelledBookings, record.cancelled_bookings),
    completionRate: firstNumber(record.completionRate, record.completion_rate),
    joinedDate: firstString(record.joinedDate, record.joined_date, record.created_at) || new Date().toISOString(),
    location: firstString(record.location),
    totalRevenue: firstNumber(record.totalRevenue, record.total_revenue),
    totalEarnings: firstNumber(record.totalEarnings, record.total_earnings),
  };
}

function normalizeTransaction(payload: unknown): Transaction {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.transaction_id),
    bookingId: firstString(record.bookingId, record.booking_id),
    customerId: firstString(record.customerId, record.customer_id),
    providerId: firstString(record.providerId, record.provider_id),
    amount: firstNumber(record.amount, record.total_amount),
    commissionAmount: firstNumber(record.commissionAmount, record.commission_amount),
    providerEarnings: firstNumber(record.providerEarnings, record.provider_earnings),
    paymentMethod: firstString(record.paymentMethod, record.payment_method) as Transaction["paymentMethod"],
    paymentStatus: firstString(record.paymentStatus, record.payment_status, "Paid") as Transaction["paymentStatus"],
    timestamp: firstString(record.timestamp, record.created_at, record.completed_at) || new Date().toISOString(),
  };
}

function normalizePayout(payload: unknown): PayoutRequest {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.payout_id),
    providerId: firstString(record.providerId, record.provider_id),
    amount: firstNumber(record.amount, record.total_amount),
    status: normalizeStatus(record.status, "Pending") as PayoutRequest["status"],
    requestedDate: firstString(record.requestedDate, record.requested_date, record.created_at) || new Date().toISOString(),
    processedDate: firstString(record.processedDate, record.processed_date),
    bankDetails: {
      accountName: firstString(record.accountName, record.account_name, record.bank_account_name),
      accountNumber: firstString(record.accountNumber, record.account_number, record.bank_account_number),
      bankName: firstString(record.bankName, record.bank_name),
    },
  };
}

function normalizeRefund(payload: unknown): Refund {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.refund_id),
    bookingId: firstString(record.bookingId, record.booking_id),
    customerId: firstString(record.customerId, record.customer_id),
    amount: firstNumber(record.amount, record.refund_amount, record.total_amount),
    reason: firstString(record.reason, record.refund_reason, record.notes),
    status: normalizeStatus(record.status, "Pending") as Refund["status"],
    requestedDate: firstString(record.requestedDate, record.requested_date, record.created_at) || new Date().toISOString(),
    processedDate: firstString(record.processedDate, record.processed_date),
  };
}

function normalizeDispute(payload: unknown): Dispute {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.dispute_id),
    bookingId: firstString(record.bookingId, record.booking_id),
    customerId: firstString(record.customerId, record.customer_id),
    providerId: firstString(record.providerId, record.provider_id),
    reason: firstString(record.reason, record.title),
    description: firstString(record.description, record.details, record.message),
    amount: firstNumber(record.amount, record.dispute_amount, record.refund_amount),
    status: normalizeStatus(record.status, "Open") as Dispute["status"],
    createdAt: firstString(record.createdAt, record.created_at, record.filed_at) || new Date().toISOString(),
    resolvedAt: firstString(record.resolvedAt, record.resolved_at),
    resolution: firstString(record.resolution),
    refundAmount: firstNumber(record.refundAmount, record.refund_amount),
  };
}

function normalizeAdmin(payload: unknown): AdminUser {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.user_id),
    name: firstString(record.name, record.full_name),
    email: firstString(record.email),
    role: normalizeAdminRole(record.role),
    permissions: Array.isArray(record.permissions) ? record.permissions.map((item) => String(item)) : [],
    lastLogin: firstString(record.lastLogin, record.last_login, record.updated_at) || new Date().toISOString(),
    status: normalizeStatus(record.status, "Active") as AdminUser["status"],
  };
}

function extractSession(payload: unknown): AdminSession {
  const record = unwrapRecord<ResponseRecord>(payload);
  const authContainer = isRecord(record.session) ? record.session : record;
  const accessToken = firstString(
    record.access_token,
    record.accessToken,
    authContainer.access_token,
    authContainer.accessToken,
    authContainer.token,
    record.token,
    record.jwt
  );
  const refreshToken = firstString(
    record.refresh_token,
    record.refreshToken,
    authContainer.refresh_token,
    authContainer.refreshToken
  ) || undefined;
  const adminRecord = isRecord(record.admin)
    ? record.admin
    : isRecord(record.user)
      ? record.user
      : isRecord(record.profile)
        ? record.profile
        : record;

  if (!accessToken) {
    throw new Error("Login response did not include an access token.");
  }

  return {
    accessToken,
    refreshToken,
    admin: normalizeAdmin(adminRecord),
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : response.statusText || "Request failed";
    throw new AdminApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const payload = await request<unknown>("/api/auth/v1/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return extractSession(payload);
}

export async function getCurrentAdmin(accessToken: string): Promise<AdminUser> {
  const payload = await request<unknown>("/api/auth/v1/me", { method: "GET" }, accessToken);
  return normalizeAdmin(unwrapRecord(payload));
}

export async function getAdminProfile(accessToken: string): Promise<AdminUser> {
  const payload = await request<unknown>("/api/admin/v1/account/profile", { method: "GET" }, accessToken);
  return normalizeAdmin(unwrapRecord(payload));
}

export async function getCustomers(accessToken: string): Promise<Customer[]> {
  const payload = await request<unknown>("/api/admin/v1/users/customers?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload).map(normalizeCustomer);
}

export async function updateCustomerStatus(accessToken: string, id: string, status: string): Promise<void> {
  await request<unknown>(`/api/admin/v1/users/customers/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export async function getOngoingBookings(accessToken: string): Promise<unknown[]> {
  const payload = await request<unknown>("/api/admin/v1/operations/ongoing", { method: "GET" }, accessToken);
  return toArray(payload);
}

export async function getDisputes(accessToken: string): Promise<Dispute[]> {
  const payload = await request<unknown>("/api/admin/v1/operations/disputes?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload).map(normalizeDispute);
}

export async function updateDisputeStatus(accessToken: string, id: string, status: string): Promise<void> {
  await request<unknown>(`/api/admin/v1/operations/disputes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export async function getSupportTickets(accessToken: string): Promise<unknown[]> {
  const payload = await request<unknown>("/api/admin/v1/operations/support?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload);
}

export async function updateSupportTicketStatus(accessToken: string, id: string, status: string): Promise<void> {
  await request<unknown>(`/api/admin/v1/operations/support/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export async function getEarnings(accessToken: string): Promise<unknown[]> {
  const payload = await request<unknown>("/api/admin/v1/finance/earnings?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload);
}

export async function getPayoutRequests(accessToken: string): Promise<PayoutRequest[]> {
  const payload = await request<unknown>("/api/admin/v1/finance/payouts?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload).map(normalizePayout);
}

export async function updatePayoutStatus(accessToken: string, id: string, status: string): Promise<void> {
  await request<unknown>(`/api/admin/v1/finance/payouts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export async function getRefundRequests(accessToken: string): Promise<Refund[]> {
  const payload = await request<unknown>("/api/admin/v1/finance/refunds?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload).map(normalizeRefund);
}

export async function markRefundProcessed(accessToken: string, id: string): Promise<void> {
  await request<unknown>(`/api/admin/v1/finance/refunds/${encodeURIComponent(id)}`, { method: "PATCH" }, accessToken);
}

export async function getFailedPayments(accessToken: string): Promise<Transaction[]> {
  const payload = await request<unknown>("/api/admin/v1/finance/failed?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload).map(normalizeTransaction);
}

export async function getMarketplaceServices(accessToken: string): Promise<unknown[]> {
  const payload = await request<unknown>("/api/admin/v1/marketplace/services?page=1&limit=200", { method: "GET" }, accessToken);
  return toArray(payload);
}

export async function getServiceAreas(accessToken: string): Promise<unknown[]> {
  const payload = await request<unknown>("/api/admin/v1/marketplace/service-areas", { method: "GET" }, accessToken);
  return toArray(payload);
}

export async function getRevenueReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/revenue", { method: "GET" }, accessToken);
}

export async function getBookingsReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/bookings", { method: "GET" }, accessToken);
}

export async function getBusinessReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/business", { method: "GET" }, accessToken);
}

export async function getFinancialReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/financial", { method: "GET" }, accessToken);
}

export async function getUserReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/users", { method: "GET" }, accessToken);
}

export async function getPerformanceReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/performance", { method: "GET" }, accessToken);
}

export async function getComplianceReport(accessToken: string): Promise<unknown> {
  return request<unknown>("/api/admin/v1/reports/compliance", { method: "GET" }, accessToken);
}

export async function logoutAdmin(accessToken: string): Promise<void> {
  await request<unknown>("/api/auth/v1/logout", { method: "POST" }, accessToken);
}

// ── Status normalizers ─────────────────────────────────────────────────────

function normalizeBookingStatus(raw: unknown): string {
  switch (String(raw).toLowerCase()) {
    case "pending":      return "Pending";
    case "confirmed":    return "Confirmed";
    case "in_progress":  return "In Progress";
    case "completed":    return "Completed";
    case "cancelled":
    case "canceled":     return "Cancelled";
    case "disputed":     return "Cancelled";
    default:             return "Pending";
  }
}

function normalizePaymentStatus(raw: unknown): string {
  switch (String(raw).toLowerCase()) {
    case "paid":
    case "completed": return "Paid";
    case "refunded":  return "Refunded";
    case "failed":    return "Failed";
    default:          return "Pending";
  }
}

// ── Entity normalizers ─────────────────────────────────────────────────────

function normalizeBooking(payload: unknown): Booking {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.booking_id),
    customerId: firstString(record.customerId, record.customer_id),
    providerId: firstString(record.providerId, record.provider_id),
    categoryId: firstString(record.categoryId, record.category_id, record.service_id),
    serviceDescription: firstString(record.serviceDescription, record.service_description, record.service_address),
    scheduledDate: firstString(record.scheduledDate, record.scheduled_date, record.scheduled_at) || new Date().toISOString(),
    completedDate: firstString(record.completedDate, record.completed_date, record.completed_at) || undefined,
    amount: firstNumber(record.amount, record.total_amount),
    commissionAmount: firstNumber(record.commissionAmount, record.commission_amount),
    providerEarnings: firstNumber(record.providerEarnings, record.provider_earnings),
    status: normalizeBookingStatus(record.status) as Booking["status"],
    paymentStatus: normalizePaymentStatus(record.payment_status ?? record.paymentStatus) as Booking["paymentStatus"],
    paymentMethod: (firstString(record.paymentMethod, record.payment_method) || "Credit Card") as Booking["paymentMethod"],
    location: firstString(record.location, record.service_address),
    createdAt: firstString(record.createdAt, record.created_at) || new Date().toISOString(),
  };
}

function normalizePaymentAsTransaction(payload: unknown): Transaction {
  const record = isRecord(payload) ? payload : {};
  return {
    id: firstString(record.id, record.payment_id, record.transaction_id),
    bookingId: firstString(record.bookingId, record.booking_id),
    customerId: firstString(record.customerId, record.customer_id),
    providerId: firstString(record.providerId, record.provider_id),
    amount: firstNumber(record.amount, record.total_amount),
    commissionAmount: firstNumber(record.commissionAmount, record.commission_amount),
    providerEarnings: firstNumber(record.providerEarnings, record.provider_earnings),
    paymentMethod: (firstString(record.paymentMethod, record.payment_method) || "Credit Card") as Transaction["paymentMethod"],
    paymentStatus: normalizePaymentStatus(record.status ?? record.payment_status) as Transaction["paymentStatus"],
    timestamp: firstString(record.timestamp, record.created_at, record.completed_at) || new Date().toISOString(),
  };
}

// ── New data-fetching functions ────────────────────────────────────────────

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const payload = await request<unknown>("/api/services/v1/categories");
  const categories = isRecord(payload) && Array.isArray((payload as Record<string, unknown>).categories)
    ? (payload as Record<string, unknown>).categories as unknown[]
    : toArray(payload);
  return categories.map(normalizeServiceCategory);
}

export async function getBookingHistory(accessToken: string): Promise<Booking[]> {
  const payload = await request<unknown>("/api/booking/v1/history", { method: "GET" }, accessToken);
  const history = isRecord(payload) && Array.isArray((payload as Record<string, unknown>).history)
    ? (payload as Record<string, unknown>).history as unknown[]
    : toArray(payload);
  return history.map(normalizeBooking);
}

export async function getOngoingBookingsAsBookings(accessToken: string): Promise<Booking[]> {
  const payload = await request<unknown>("/api/admin/v1/operations/ongoing", { method: "GET" }, accessToken);
  const bookings = isRecord(payload) && Array.isArray((payload as Record<string, unknown>).bookings)
    ? (payload as Record<string, unknown>).bookings as unknown[]
    : toArray(payload);
  return bookings.map(normalizeBooking);
}

export async function getPaymentTransactions(accessToken: string): Promise<Transaction[]> {
  const payload = await request<unknown>("/api/admin/v1/finance/earnings?page=1&limit=500", { method: "GET" }, accessToken);
  const payments = isRecord(payload) && Array.isArray((payload as Record<string, unknown>).payments)
    ? (payload as Record<string, unknown>).payments as unknown[]
    : toArray(payload);
  return payments.map(normalizePaymentAsTransaction);
}

export async function getAdminActivityLog(
  accessToken: string,
  page = 1,
  limit = 50,
): Promise<AuditLog[]> {
  const payload = await request<unknown>(
    `/api/admin/v1/account/activity-log?page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken,
  );
  const logs = isRecord(payload) && Array.isArray((payload as Record<string, unknown>).logs)
    ? (payload as Record<string, unknown>).logs as unknown[]
    : toArray(payload);
  return logs.map((item) => {
    const r = isRecord(item) ? item : {};
    return {
      id: firstString(r.id),
      action: firstString(r.action),
      userId: firstString(r.userId, r.user_id),
      timestamp: firstString(r.timestamp, r.created_at) || new Date().toISOString(),
      details: firstString(r.details, r.metadata ? JSON.stringify(r.metadata) : ""),
      ipAddress: firstString(r.ipAddress, r.ip_address),
    };
  });
}

export function getStoredAdminSession(): AdminSession | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const rawSession = localStorage.getItem("servease_admin_session");
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as Partial<AdminSession>;
      if (parsed.accessToken && parsed.admin) {
        return {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          admin: normalizeAdmin(parsed.admin),
        };
      }
    } catch {
      localStorage.removeItem("servease_admin_session");
    }
  }

  return null;
}

export function storeAdminSession(session: AdminSession): void {
  localStorage.setItem("servease_admin_session", JSON.stringify(session));
  localStorage.setItem("servease_admin", JSON.stringify(session.admin));
}

export function clearAdminSession(): void {
  localStorage.removeItem("servease_admin_session");
  localStorage.removeItem("servease_admin");
}

export {
  normalizeAdmin,
  normalizeCustomer,
  normalizeDispute,
  normalizePayout,
  normalizeRefund,
  normalizeServiceCategory,
  normalizeServiceProvider,
  normalizeTransaction,
  toArray,
};