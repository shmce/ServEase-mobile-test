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
