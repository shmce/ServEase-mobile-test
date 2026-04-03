import { api } from '../lib/apiClient';
import { providerCatalogDb, identityDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';
import { createBookingStatusNotification } from './notificationService';

export const getCustomerBookings = async (customerId: string) => {
  const { bookings } = await api.get<{ bookings: any[] }>(`/booking/customer/${customerId}`);
  return bookings;
};


export const createBooking = async (bookingData: any) => {
  const inserted = await api.post<any>('/booking/create', {
    provider_id: bookingData.provider_id,
    service_id: bookingData.service_id,
    service_address: bookingData.service_address || bookingData.address || '',
    scheduled_at: parseScheduleLocal(
      String(bookingData.scheduled_date_key || bookingData.scheduled_date || '').trim(),
      String(bookingData.scheduled_time || '').trim()
    )?.toISOString(),
    pricing_mode: bookingData.pricing_mode || 'flat',
    hourly_rate: bookingData.hourly_rate,
    flat_rate: bookingData.flat_rate,
    hours_required: bookingData.hours_required,
  });

  const booking = inserted.booking ?? inserted;
  await maybeNotifyProviderAboutNewBooking(booking, bookingData.customer_id);
  return booking;
};

export const getBookingById = async (bookingId: string) => {
  const { booking } = await api.get<{ booking: any }>(`/booking/${bookingId}`);
  return booking;
};

export const cancelCustomerBooking = async (bookingId: string, _customerId: string, reason: string, explanation: string) => {
  const { booking } = await api.patch<{ booking: any }>(`/booking/${bookingId}/cancel`, { reason, explanation });
  await maybeNotifyProviderAboutCustomerCancellation(booking, _customerId);
  return booking;
};

// ── Helpers (keep Supabase direct for notification lookups) ─────────────────

const parseTimeTo24h = (input: string) => {
  const m = String(input || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const period = m[3].toUpperCase();
  if (period === 'AM') { if (hours === 12) hours = 0; } else if (hours !== 12) hours += 12;
  return { hours, minutes };
};

const parseScheduleLocal = (dateInput: string, timeInput: string) => {
  const time = parseTimeTo24h(timeInput);
  if (!time) return null;
  const ymd = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const dt = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), time.hours, time.minutes, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const parsedDate = new Date(dateInput);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const dt = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), time.hours, time.minutes, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const maybeNotifyProviderAboutNewBooking = async (booking: any, customerId: string) => {
  const providerId = String(booking?.provider_id || '').trim();
  const bookingId = String(booking?.id || '').trim();
  if (!providerId || !bookingId) return;
  try {
    const [{ data: customer }, { data: service }] = await Promise.all([
      identityDb.from('users').select('full_name,contact_number').eq('id', customerId).maybeSingle(),
      booking?.service_id ? providerCatalogDb.from('provider_services').select('title').eq('id', booking.service_id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    const customerName = String(customer?.full_name || 'Customer');
    const serviceName = String(service?.title || 'Service Booking');
    await createBookingStatusNotification({
      recipientUserId: providerId, recipientRole: 'provider', actorId: customerId, bookingId,
      type: 'booking_requested', title: `New booking request from ${customerName}`,
      body: `${serviceName} needs your confirmation.`,
      senderName: customerName, senderPhone: String(customer?.contact_number || ''), serviceName,
      bookingStatus: String(booking?.status || 'pending'),
      target: { screen: '/provider-booking-details', params: { id: bookingId } },
      fallbackTarget: { screen: '/provider-chat', params: { id: bookingId, name: customerName, phone: String(customer?.contact_number || ''), serviceName, initials: customerName.split(/\s+/).map((p) => p[0] || '').join('').slice(0, 2).toUpperCase() } },
    });
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to notify provider about new booking.'));
  }
};

const maybeNotifyProviderAboutCustomerCancellation = async (booking: any, customerId: string) => {
  const providerId = String(booking?.provider_id || '').trim();
  const bookingId = String(booking?.id || '').trim();
  if (!providerId || !bookingId) return;
  try {
    const [{ data: customer }, { data: service }] = await Promise.all([
      identityDb.from('users').select('full_name,contact_number').eq('id', customerId).maybeSingle(),
      booking?.service_id ? providerCatalogDb.from('provider_services').select('title').eq('id', booking.service_id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    const customerName = String(customer?.full_name || 'Customer');
    const serviceName = String(service?.title || 'Service Booking');
    await createBookingStatusNotification({
      recipientUserId: providerId, recipientRole: 'provider', actorId: customerId, bookingId,
      type: 'booking_cancelled', title: `${customerName} cancelled the booking`,
      body: `${serviceName} no longer requires provider action.`,
      senderName: customerName, senderPhone: String(customer?.contact_number || ''), serviceName,
      bookingStatus: String(booking?.status || 'cancelled'),
      target: { screen: '/provider-booking-details', params: { id: bookingId } },
      fallbackTarget: { screen: '/provider-chat', params: { id: bookingId, name: customerName, phone: String(customer?.contact_number || ''), serviceName, initials: customerName.split(/\s+/).map((p) => p[0] || '').join('').slice(0, 2).toUpperCase() } },
    });
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to notify provider about booking cancellation.'));
  }
};
