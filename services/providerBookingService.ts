import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';
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
  const { data, error } = await supabase
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
      ? supabase.from('users').select('id,full_name').in('id', customerIds)
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? supabase.from('provider_services').select('id,title').in('id', serviceIds)
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
  const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (error) throw new Error(getErrorMessage(error, 'Failed to load booking details.'));
  if (!data) return null;

  const [{ data: customer }, { data: service }] = await Promise.all([
    supabase.from('users').select('id,full_name,contact_number').eq('id', data.customer_id).maybeSingle(),
    supabase.from('provider_services').select('id,title,description,price').eq('id', data.service_id).maybeSingle(),
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
  const variants: Record<string, string[]> = {
    confirmed: ['confirmed', 'Confirmed', 'accepted', 'Accepted'],
    in_progress: ['in_progress', 'In Progress', 'in-progress', 'ongoing', 'started', 'on_the_way', 'On the Way'],
    completed: ['completed', 'Completed', 'done'],
    cancelled: ['cancelled', 'Cancelled', 'canceled', 'Canceled'],
  };

  let lastError: any = null;
  for (const statusValue of variants[target]) {
    const strict = await supabase
      .from('bookings')
      .update({ status: statusValue })
      .eq('id', bookingId)
      .eq('provider_id', providerId)
      .select('*')
      .maybeSingle();

    if (!strict.error && strict.data) return strict.data;
    lastError = strict.error || new Error('No booking row matched this provider.');

    // Fallback: some projects store provider linkage differently; let RLS enforce ownership.
    const relaxed = await supabase
      .from('bookings')
      .update({ status: statusValue })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (!relaxed.error && relaxed.data) return relaxed.data;
    lastError = relaxed.error || lastError;
  }

  throw new Error(formatDbError(lastError, 'Failed to update booking status.'));
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string) => {
  const { error } = await supabase.from('support_tickets').insert({
    ticket_id: createUuid(),
    user_id: providerId,
    subject,
    message,
  });

  if (error) throw new Error(getErrorMessage(error, 'Failed to submit support ticket.'));
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string) => {
  const { error } = await supabase.from('disputes').insert({
    dispute_id: createUuid(),
    booking_id: bookingId,
    raised_by: providerId,
    reason,
  });

  if (error) throw new Error(getErrorMessage(error, 'Failed to create dispute.'));
};
