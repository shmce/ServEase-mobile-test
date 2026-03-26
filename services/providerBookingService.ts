import { bookingDb, identityDb, providerCatalogDb, notificationDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';
import { createBookingStatusNotification } from './notificationService';
import { cancelBookingPayment, markBookingPaymentPaid } from './paymentService';

const formatDbError = (error: any, fallback: string) => {
  const base = getErrorMessage(error, fallback);
  const code = error?.code ? ` [${error.code}]` : '';
  const details = error?.details ? `\n${error.details}` : '';
  const hint = error?.hint ? `\nHint: ${error.hint}` : '';
  return `${base}${code}${details}${hint}`;
};
const createUuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });

export type ProviderBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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

const STATUS_VARIANTS: Record<ProviderBookingStatus, string[]> = {
  pending: ['pending', 'Pending', 'requested', 'Requested'],
  confirmed: ['confirmed', 'Confirmed', 'accepted', 'Accepted', 'assigned', 'Assigned'],
  in_progress: ['in_progress', 'In Progress', 'in-progress', 'ongoing', 'started', 'on_the_way', 'On the Way', 'arrived', 'Arrived'],
  completed: ['completed', 'Completed', 'done'],
  cancelled: ['cancelled', 'Cancelled', 'canceled', 'Canceled'],
};

const STATUS_LABELS: Record<ProviderBookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const buildProviderStatusNotificationTarget = (bookingId: string, target: ProviderBookingStatus) => {
  if (target === 'in_progress') {
    return {
      screen: '/customer-track-order',
      params: { id: bookingId },
    };
  }

  return {
    screen: '/customer-booking-details',
    params: { id: bookingId },
  };
};

export const normalizeProviderBookingStatus = (statusRaw?: string | null): ProviderBookingStatus => {
  const status = String(statusRaw || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

  if (!status) return 'pending';
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('complete') || status === 'done') return 'completed';
  if (status.includes('progress') || status.includes('ongoing') || status.includes('start') || status.includes('arrived') || status.includes('on_the_way')) {
    return 'in_progress';
  }
  if (status.includes('confirm') || status.includes('accept') || status.includes('assign')) {
    return 'confirmed';
  }
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
  service_title: string;
};

export const getProviderBookings = async (providerId: string) => {
  const { data, error } = await bookingDb
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .order('scheduled_at', { ascending: true });

  if (error) throw new Error(getErrorMessage(error, 'Failed to load provider bookings.'));

  const rows = (data || []) as any[];
  if (!rows.length) return [] as ProviderBookingView[];

  const customerIds = Array.from(new Set(rows.map((b) => b.customer_id).filter(Boolean)));
  const serviceIds = Array.from(new Set(rows.map((b) => b.service_id).filter(Boolean)));

  const [{ data: customers }, { data: services }] = await Promise.all([
    customerIds.length
      ? identityDb.from('users').select('id,full_name').in('id', customerIds)
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? providerCatalogDb.from('provider_services').select('id,title').in('id', serviceIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const customerMap = new Map((customers || []).map((c: any) => [c.id, c.full_name || 'Customer']));
  const serviceMap = new Map((services || []).map((s: any) => [s.id, s.title || 'Service']));

  return rows.map((b) => ({
    id: String(b.id),
    booking_reference: b.booking_reference || String(b.id),
    customer_id: b.customer_id,
    provider_id: b.provider_id,
    service_id: b.service_id,
    status: String(b.status || ''),
    service_address: b.service_address || '',
    scheduled_at: b.scheduled_at,
    total_amount: Number(b.total_amount || 0),
    customer_name: customerMap.get(b.customer_id) || 'Customer',
    service_title: serviceMap.get(b.service_id) || 'Service',
  })) as ProviderBookingView[];
};

export const getProviderBookingById = async (bookingId: string) => {
  const { data, error } = await bookingDb.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (error) throw new Error(getErrorMessage(error, 'Failed to load booking details.'));
  if (!data) return null;

  const [{ data: customer }, { data: service }] = await Promise.all([
    identityDb.from('users').select('id,full_name,contact_number').eq('id', data.customer_id).maybeSingle(),
    providerCatalogDb.from('provider_services').select('id,title,description,price').eq('id', data.service_id).maybeSingle(),
  ]);

  return {
    ...data,
    customer_name: customer?.full_name || 'Customer',
    customer_contact: customer?.contact_number || '',
    service_title: service?.title || 'Service',
    service_description: service?.description || '',
    service_price: Number(service?.price || data.total_amount || 0),
  };
};

export const updateBookingStatus = async (bookingId: string, providerId: string, target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
  let lastError: any = null;
  for (const statusValue of STATUS_VARIANTS[target]) {
    const strict = await bookingDb
      .from('bookings')
      .update({ status: statusValue })
      .eq('id', bookingId)
      .eq('provider_id', providerId)
      .select('*')
      .maybeSingle();

    if (!strict.error && strict.data) {
      await syncPaymentWithBookingStatus(strict.data, target);
      await maybeNotifyCustomerOnProviderStatusChange(strict.data, providerId, target);
      return strict.data;
    }
    lastError = strict.error || new Error('No booking row matched this provider.');

    // Fallback: some projects store provider linkage differently; let RLS enforce ownership.
    const relaxed = await bookingDb
      .from('bookings')
      .update({ status: statusValue })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (!relaxed.error && relaxed.data) {
      await syncPaymentWithBookingStatus(relaxed.data, target);
      await maybeNotifyCustomerOnProviderStatusChange(relaxed.data, providerId, target);
      return relaxed.data;
    }
    lastError = relaxed.error || lastError;
  }

  throw new Error(formatDbError(lastError, 'Failed to update booking status.'));
};

const syncPaymentWithBookingStatus = async (
  booking: any,
  target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
) => {
  const bookingId = String(booking?.id || '').trim();
  if (!bookingId) return;

  try {
    if (target === 'completed') {
      await markBookingPaymentPaid({
        bookingId,
        amount: Number(booking?.total_amount || 0),
        customerId: String(booking?.customer_id || ''),
        providerId: String(booking?.provider_id || ''),
      });
      return;
    }

    if (target === 'cancelled') {
      await cancelBookingPayment(bookingId);
    }
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to sync payment with booking status.'));
  }
};

const maybeNotifyCustomerOnProviderStatusChange = async (
  booking: any,
  providerId: string,
  target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
) => {
  const bookingId = String(booking?.id || '').trim();
  const customerId = String(booking?.customer_id || '').trim();
  if (!bookingId || !customerId) return;

  try {
    const [{ data: provider }, { data: service }] = await Promise.all([
      identityDb.from('users').select('full_name,contact_number').eq('id', providerId).maybeSingle(),
      booking?.service_id
        ? providerCatalogDb.from('provider_services').select('title').eq('id', booking.service_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    const providerName = String(provider?.full_name || 'Service Provider');
    const serviceName = String(service?.title || 'Service Booking');
    const targetConfig = buildProviderStatusNotificationTarget(bookingId, target);

    const notificationMap = {
      confirmed: {
        type: 'booking_confirmed' as const,
        title: `${providerName} confirmed your booking`,
        body: `${serviceName} is confirmed and ready for tracking.`,
      },
      in_progress: {
        type: 'booking_in_progress' as const,
        title: `${providerName} started your service`,
        body: `${serviceName} is now in progress.`,
      },
      completed: {
        type: 'booking_completed' as const,
        title: `${serviceName} is complete`,
        body: `Your provider marked this service as completed.`,
      },
      cancelled: {
        type: 'booking_cancelled' as const,
        title: `${serviceName} was cancelled`,
        body: `This booking was cancelled by the provider.`,
      },
    }[target];

    await createBookingStatusNotification({
      recipientUserId: customerId,
      recipientRole: 'customer',
      actorId: providerId,
      bookingId,
      type: notificationMap.type,
      title: notificationMap.title,
      body: notificationMap.body,
      senderName: providerName,
      senderPhone: String(provider?.contact_number || ''),
      serviceName,
      bookingStatus: String(booking?.status || target),
      target: targetConfig,
      fallbackTarget: {
        screen: '/customer-chat',
        params: {
          id: bookingId,
          providerName,
          phone: String(provider?.contact_number || ''),
          serviceName,
        },
      },
    });
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to create customer booking notification.'));
  }
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string) => {
  const { error } = await notificationDb.from('support_tickets').insert({
    ticket_id: createUuid(),
    user_id: providerId,
    subject,
    message,
  });

  if (error) throw new Error(getErrorMessage(error, 'Failed to submit support ticket.'));
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string) => {
  const { error } = await notificationDb.from('disputes').insert({
    dispute_id: createUuid(),
    booking_id: bookingId,
    raised_by: providerId,
    reason,
  });

  if (error) throw new Error(getErrorMessage(error, 'Failed to create dispute.'));
};
