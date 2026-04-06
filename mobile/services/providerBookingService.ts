import { api } from '../lib/apiClient';
import { getErrorMessage } from '../lib/error-handling';
import {
  Booking,
  BookingStatus as GlobalBookingStatus,
  SupportTicket,
  Dispute,
} from '../src/types/database.interfaces';

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

export interface ProviderBookingView extends Booking {
  customer_name: string;
  customer_contact: string;
  service_title: string;
}


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

export const getProviderBookings = async (_providerId?: string): Promise<ProviderBookingView[]> => {
  const { bookings } = await api.get<{ bookings: ProviderBookingView[] }>('/provider/bookings');
  return bookings;
};

export const getProviderBookingById = async (bookingId: string): Promise<ProviderBookingView> => {
  const { booking } = await api.get<{ booking: ProviderBookingView }>(`/provider/booking/${bookingId}`);
  return booking;
};

export const updateBookingStatus = async (
  bookingId: string,
  _providerId: string,
  target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
): Promise<Booking> => {
  const { booking } = await api.patch<{ booking: Booking }>(`/provider/booking/${bookingId}/status`, {
    status: target,
  });
  return booking;
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string): Promise<SupportTicket> => {
  const { ticket } = await api.post<{ ticket: SupportTicket }>('/support/tickets', {
    user_id: providerId,
    subject,
    message,
  });
  return ticket;
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string): Promise<Dispute> => {
  const { dispute } = await api.post<{ dispute: Dispute }>(`/booking/${bookingId}/disputes`, {
    reason,
    raised_by: providerId,
  });
  return dispute;
};

