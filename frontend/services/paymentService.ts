import { api } from '../lib/apiClient';

export type PaymentRow = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_reference?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export type ProviderPaymentHistoryItem = PaymentRow & {
  booking_reference: string;
  customer_name: string;
  service_title: string;
  scheduled_at?: string | null;
  net_earnings: number;
  platform_fee: number;
};

export type PaymentMethod = 'cash' | 'gcash' | 'paymaya' | 'card';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'cancelled' | 'refunded';

export const getPaymentByBookingId = async (bookingId: string): Promise<PaymentRow | null> => {
  const { payment } = await api.get<{ payment: PaymentRow | null }>(`/payments/booking/${bookingId}`);
  return payment;
};

export const getProviderPayments = async (providerId: string): Promise<PaymentRow[]> => {
  const { payments } = await api.get<{ payments: any[] }>(`/payments/provider/${providerId}/history`);
  return payments;
};

export const getProviderPaymentHistory = async (providerId: string): Promise<ProviderPaymentHistoryItem[]> => {
  const { payments } = await api.get<{ payments: ProviderPaymentHistoryItem[] }>(`/payments/provider/${providerId}/history`);
  return payments;
};

export const getProviderEarningsSummary = async (providerId: string) => {
  return api.get<any>(`/payments/provider/${providerId}/earnings-summary`);
};

export const ensureBookingPayment = async (input: { bookingId: string; customerId: string; providerId: string; amount: number; method?: PaymentMethod }) => {
  const { payment } = await api.post<{ payment: PaymentRow }>('/payments/booking/ensure', input);
  return payment;
};

export const markBookingPaymentPaid = async (input: { bookingId: string; amount?: number; customerId?: string; providerId?: string; method?: PaymentMethod }) => {
  const { payment } = await api.patch<{ payment: PaymentRow }>('/payments/booking/mark-paid', input);
  return payment;
};

export const cancelBookingPayment = async (bookingId: string) => {
  const { payment } = await api.patch<{ payment: PaymentRow | null }>(`/payments/booking/${bookingId}/cancel`);
  return payment;
};

export const updateBookingPaymentAmount = async (bookingId: string, amount: number) => {
  const { payment } = await api.patch<{ payment: PaymentRow }>(`/payments/booking/${bookingId}/amount`, { amount });
  return payment;
};

export const getPaymentStatusLabel = (statusRaw?: string | null) => {
  const s = String(statusRaw || '').trim().toLowerCase();
  if (s === 'paid') return 'Paid';
  if (s === 'authorized') return 'Authorized';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'refunded') return 'Refunded';
  return 'Pending';
};

export const getPaymentMethodLabel = (methodRaw?: string | null) => {
  const m = String(methodRaw || '').trim().toLowerCase();
  if (m === 'gcash') return 'GCash';
  if (m === 'paymaya') return 'PayMaya';
  if (m === 'card') return 'Card';
  return 'Cash on Service';
};
