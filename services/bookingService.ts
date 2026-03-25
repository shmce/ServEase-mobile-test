import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';

const formatDbError = (error: any, fallback: string) => {
  const base = getErrorMessage(error, fallback);
  const code = error?.code ? ` [${error.code}]` : '';
  const details = error?.details ? `\n${error.details}` : '';
  const hint = error?.hint ? `\nHint: ${error.hint}` : '';
  return `${base}${code}${details}${hint}`;
};

const parseTimeTo24h = (input: string) => {
  const raw = String(input || '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const period = m[3].toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }
  return { hours, minutes };
};

const parseScheduleLocal = (dateInput: string, timeInput: string) => {
  const time = parseTimeTo24h(timeInput);
  if (!time) return null;

  const dateRaw = String(dateInput || '').trim();
  const ymd = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const d = Number(ymd[3]);
    const dt = new Date(y, m, d, time.hours, time.minutes, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // Fallback for values like "March 25, 2026"
  const parsedDate = new Date(dateRaw);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const dt = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  );
  return Number.isNaN(dt.getTime()) ? null : dt;
};

export const getCustomerBookings = async (customerId: string) => {
  const richQuery = await supabase
    .from('bookings')
    .select(`
      *,
      provider:users!bookings_provider_id_fkey(full_name, contact_number),
      service:provider_services!bookings_service_id_fkey(title, price)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (!richQuery.error) {
    return richQuery.data;
  }

  const fallbackCustomerId = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (!fallbackCustomerId.error) {
    return fallbackCustomerId.data;
  }

  const fallbackUserId = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', customerId)
    .order('created_at', { ascending: false });

  if (!fallbackUserId.error) {
    return fallbackUserId.data;
  }

  console.error('Error fetching bookings:', fallbackUserId.error);
  throw new Error(getErrorMessage(fallbackUserId.error, 'Failed to load bookings.'));
};

export const createBooking = async (bookingData: any) => {
  const serviceTitle = String(bookingData.service_name || '').trim();
  const requestedServiceId = String(bookingData.service_id || '').trim();
  let providerId = bookingData.provider_id;
  let serviceRow: any = null;
  let serviceError: any = null;

  if (requestedServiceId) {
    const byId = await supabase
      .from('provider_services')
      .select('id, price, provider_id, title')
      .eq('id', requestedServiceId)
      .maybeSingle();
    serviceRow = byId.data;
    serviceError = byId.error;
  }

  if (!serviceRow && providerId) {
    const withProvider = await supabase
      .from('provider_services')
      .select('id, price, provider_id')
      .eq('provider_id', providerId)
      .eq('title', serviceTitle)
      .limit(1)
      .maybeSingle();
    serviceRow = withProvider.data;
    serviceError = withProvider.error;
  }

  if (!serviceRow) {
    const byTitle = await supabase
      .from('provider_services')
      .select('id, price, provider_id')
      .eq('title', serviceTitle)
      .limit(1)
      .maybeSingle();
    serviceRow = byTitle.data;
    serviceError = byTitle.error;
  }

  if (serviceError) {
    throw new Error(formatDbError(serviceError, 'Failed to resolve service.'));
  }
  if (!serviceRow?.id) {
    throw new Error('Selected service is not available for this provider.');
  }
  providerId = providerId || serviceRow.provider_id;

  const dateInput = String(bookingData.scheduled_date_key || bookingData.scheduled_date || '').trim();
  const scheduledAt = parseScheduleLocal(dateInput, bookingData.scheduled_time);
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    throw new Error('Invalid date/time selected.');
  }

  const bookingReference = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const basePayload = {
    booking_reference: bookingReference,
    customer_id: bookingData.customer_id,
    provider_id: providerId,
    service_id: serviceRow.id,
    service_address: bookingData.service_address || bookingData.address || '',
    scheduled_at: scheduledAt.toISOString(),
    total_amount: bookingData.total_amount ?? serviceRow.price ?? 0,
  };

  const statusCandidates: Array<string | null> = ['pending', 'Pending', null];
  let inserted: any = null;
  let lastError: any = null;

  for (const status of statusCandidates) {
    const payload = status ? { ...basePayload, status } : basePayload;
    const { data, error } = await supabase
      .from('bookings')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      inserted = data;
      break;
    }
    lastError = error;
  }

  if (!inserted) {
    throw new Error(formatDbError(lastError, 'Failed to create booking.'));
  }

  return inserted;
};

export const getBookingById = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Failed to load booking details.'));
  }

  return data;
};

export const cancelCustomerBooking = async (
  bookingId: string,
  customerId: string,
  reason: string,
  explanation: string
) => {
  const payloads = [{ status: 'Cancelled' }, { status: 'cancelled' }];

  let lastError: any = null;

  for (const payload of payloads) {
    const byCustomerId = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', bookingId)
      .eq('customer_id', customerId)
      .select('*')
      .maybeSingle();
    if (!byCustomerId.error && byCustomerId.data) return byCustomerId.data;
    lastError = byCustomerId.error;

    const byUserId = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', bookingId)
      .eq('user_id', customerId)
      .select('*')
      .maybeSingle();
    if (!byUserId.error && byUserId.data) return byUserId.data;
    lastError = byUserId.error;
  }

  throw new Error(getErrorMessage(lastError, 'Failed to cancel booking.'));
};
