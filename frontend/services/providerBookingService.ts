import { api } from '../lib/apiClient';
import { identityDb, providerCatalogDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';
import { createBookingStatusNotification } from './notificationService';

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
  await maybeNotifyCustomerOnProviderStatusChange(booking, providerId, target);
  return booking;
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string) => {
  // Keep direct since it goes to notification_svc schema
  const { notificationDb } = await import('../lib/db');
  const { error } = await notificationDb.from('support_tickets').insert({ user_id: providerId, subject, message });
  if (error) throw new Error(getErrorMessage(error, 'Failed to submit support ticket.'));
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string) => {
  const { notificationDb } = await import('../lib/db');
  const { error } = await notificationDb.from('disputes').insert({ booking_id: bookingId, raised_by: providerId, reason });
  if (error) throw new Error(getErrorMessage(error, 'Failed to create dispute.'));
};

// ── Notification helper (keeps Supabase direct for realtime lookups) ────────

const buildNotificationTarget = (bookingId: string, target: ProviderBookingStatus) =>
  target === 'in_progress'
    ? { screen: '/customer-track-order', params: { id: bookingId } }
    : { screen: '/customer-booking-details', params: { id: bookingId } };

const maybeNotifyCustomerOnProviderStatusChange = async (booking: any, providerId: string, target: ProviderBookingStatus) => {
  const bookingId = String(booking?.id || '').trim();
  const customerId = String(booking?.customer_id || '').trim();
  if (!bookingId || !customerId) return;
  try {
    const [{ data: provider }, { data: service }] = await Promise.all([
      identityDb.from('users').select('full_name,contact_number').eq('id', providerId).maybeSingle(),
      booking?.service_id ? providerCatalogDb.from('provider_services').select('title').eq('id', booking.service_id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    const providerName = String(provider?.full_name || 'Service Provider');
    const serviceName = String(service?.title || 'Service Booking');
    const notificationMap = {
      confirmed: { type: 'booking_confirmed' as const, title: `${providerName} confirmed your booking`, body: `${serviceName} is confirmed and ready for tracking.` },
      in_progress: { type: 'booking_in_progress' as const, title: `${providerName} started your service`, body: `${serviceName} is now in progress.` },
      completed: { type: 'booking_completed' as const, title: `${serviceName} is complete`, body: `Your provider marked this service as completed.` },
      cancelled: { type: 'booking_cancelled' as const, title: `${serviceName} was cancelled`, body: `This booking was cancelled by the provider.` },
    }[target as 'confirmed' | 'in_progress' | 'completed' | 'cancelled'];

    if (!notificationMap) return;

    await createBookingStatusNotification({
      recipientUserId: customerId, recipientRole: 'customer', actorId: providerId, bookingId,
      type: notificationMap.type, title: notificationMap.title, body: notificationMap.body,
      senderName: providerName, senderPhone: String(provider?.contact_number || ''), serviceName,
      bookingStatus: String(booking?.status || target),
      target: buildNotificationTarget(bookingId, target),
      fallbackTarget: { screen: '/customer-chat', params: { id: bookingId, providerName, phone: String(provider?.contact_number || ''), serviceName } },
    });
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to create customer booking notification.'));
  }
};
