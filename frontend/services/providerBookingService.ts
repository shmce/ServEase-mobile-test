import { api } from '../lib/apiClient';
import { getErrorMessage } from '../lib/error-handling';

export type ProviderBookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type ProviderBookingActionState = {
  normalizedStatus: ProviderBookingStatus;
  label: string;
  canConfirm: boolean;
  canNavigate: boolean;
  canStartService: boolean;
  canResumeService: boolean;
  canComplete: boolean;
  canCancel: boolean;
};

export type ProviderBookingView = {
  id: string;
  booking_reference: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  status: string;
  service_address: string;
  scheduled_at: string;
  total_amount: number;
  customer_name: string;
  customer_contact: string;
  service_title: string;
};


const STATUS_LABELS: Record<ProviderBookingStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

export const normalizeProviderBookingStatus = (statusRaw?: string | null): ProviderBookingStatus => {
  const s = String(statusRaw || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (!s) return 'pending';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('complete') || s === 'done') return 'completed';
  if (s.includes('progress') || s.includes('ongoing') || s.includes('start') || s.includes('arrived') || s.includes('on_the_way')) return 'in_progress';
  if (s.includes('confirm') || s.includes('accept') || s.includes('assign')) return 'confirmed';
  return 'pending';
};

export const getProviderBookingActionState = (statusRaw?: string | null): ProviderBookingActionState => {
  const normalizedStatus = normalizeProviderBookingStatus(statusRaw);
  return {
    normalizedStatus,
    label: STATUS_LABELS[normalizedStatus],
    canConfirm: normalizedStatus === 'pending',
    canNavigate: normalizedStatus === 'confirmed',
    canStartService: normalizedStatus === 'confirmed',
    canResumeService: normalizedStatus === 'in_progress',
    canComplete: normalizedStatus === 'in_progress',
    canCancel: normalizedStatus === 'pending' || normalizedStatus === 'confirmed',
  };
};

export const getProviderBookings = async (providerId: string): Promise<ProviderBookingView[]> => {
  const { bookings } = await api.get<{ bookings: ProviderBookingView[] }>(`/provider/${providerId}/bookings`);
  return bookings;
};

export const getProviderBookingById = async (bookingId: string) => {
  const { booking } = await api.get<{ booking: any }>(`/provider/booking/${bookingId}`);
  return booking;
};

export const updateBookingStatus = async (bookingId: string, providerId: string, target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
  const { booking } = await api.patch<{ booking: any }>(`/provider/booking/${bookingId}/status`, { provider_id: providerId, status: target });
  return booking;
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string) => {
  // Keep direct since it goes to notification_svc schema
  const { notificationDb } = await import('../lib/db');
  const { error } = await notificationDb.from('support_tickets').insert({ user_id: providerId, subject, message });
  if (error) throw new Error(getErrorMessage(error, 'Failed to submit support ticket.'));
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string) => {
  const { dispute } = await api.post<{ dispute: any }>(`/booking/${bookingId}/disputes`, { reason });
  return dispute;
};

