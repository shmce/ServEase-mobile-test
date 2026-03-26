import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';
import { getPaymentByBookingId, updateBookingPaymentAmount } from './paymentService';

const formatDbError = (error: any, fallback: string) => {
  const base = getErrorMessage(error, fallback);
  const code = error?.code ? ` [${error.code}]` : '';
  const details = error?.details ? `\n${error.details}` : '';
  const hint = error?.hint ? `\nHint: ${error.hint}` : '';
  return `${base}${code}${details}${hint}`;
};

export type ProviderRescheduleRequestInput = {
  bookingId: string;
  providerId: string;
  reason: string;
  explanation: string;
  proposedDate: string;
  proposedTime: string;
};

export type ProviderAdditionalChargeItemInput = {
  description: string;
  amount: number;
};

export type ProviderAdditionalChargeRequestInput = {
  bookingId: string;
  providerId: string;
  justification: string;
  items: ProviderAdditionalChargeItemInput[];
};

export type BookingRescheduleRequestRow = {
  id: string;
  booking_id: string;
  provider_id: string;
  reason: string;
  explanation: string;
  proposed_date: string;
  proposed_time: string;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type AdditionalChargeRow = {
  id: string;
  booking_id: string;
  requested_by: string;
  description: string;
  amount: number;
  justification?: string | null;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export const createProviderRescheduleRequest = async (
  input: ProviderRescheduleRequestInput
) => {
  const payload = {
    booking_id: input.bookingId,
    provider_id: input.providerId,
    reason: input.reason.trim(),
    explanation: input.explanation.trim(),
    proposed_date: input.proposedDate,
    proposed_time: input.proposedTime,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('booking_reschedule_requests')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(formatDbError(error, 'Failed to create reschedule request.'));
  }

  return data;
};

export const getProviderRescheduleRequests = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('booking_reschedule_requests')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, 'Failed to load reschedule requests.'));
  }

  return (data || []) as BookingRescheduleRequestRow[];
};

export const createProviderAdditionalChargeRequest = async (
  input: ProviderAdditionalChargeRequestInput
) => {
  if (input.items.length === 0) {
    throw new Error('Add at least one additional charge item.');
  }

  const payload = input.items.map((item) => ({
    booking_id: input.bookingId,
    requested_by: input.providerId,
    description: item.description.trim(),
    amount: Number(item.amount || 0),
    justification: input.justification.trim(),
    status: 'pending',
  }));

  const { data, error } = await supabase
    .from('additional_charges')
    .insert(payload)
    .select('*');

  if (error) {
    throw new Error(formatDbError(error, 'Failed to submit additional charges.'));
  }

  return data || [];
};

export const getProviderAdditionalChargeRequests = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('additional_charges')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, 'Failed to load additional charges.'));
  }

  return (data || []) as AdditionalChargeRow[];
};

const parseProposedSchedule = (dateInput: string, timeInput: string) => {
  const safeDate = String(dateInput || '').trim();
  const safeTime = String(timeInput || '').trim();
  const isoLike = new Date(`${safeDate}T${safeTime}`);
  if (!Number.isNaN(isoLike.getTime())) return isoLike.toISOString();

  const withLocaleTime = new Date(`${safeDate} ${safeTime}`);
  if (!Number.isNaN(withLocaleTime.getTime())) return withLocaleTime.toISOString();

  const match = safeTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  const [year, month, day] = safeDate.split('-').map(Number);
  const localDate = new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
  return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
};

export const reviewRescheduleRequest = async (input: {
  requestId: string;
  bookingId: string;
  customerId: string;
  decision: 'approved' | 'declined';
}) => {
  const reviewedAt = new Date().toISOString();
  const { data: request, error: requestError } = await supabase
    .from('booking_reschedule_requests')
    .select('*')
    .eq('id', input.requestId)
    .eq('booking_id', input.bookingId)
    .maybeSingle();

  if (requestError) {
    throw new Error(formatDbError(requestError, 'Failed to load the reschedule request.'));
  }
  if (!request) {
    throw new Error('Reschedule request not found.');
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id,customer_id')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(formatDbError(bookingError, 'Failed to verify booking ownership.'));
  }
  if (!booking || String(booking.customer_id) !== String(input.customerId)) {
    throw new Error('You can only review requests for your own booking.');
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from('booking_reschedule_requests')
    .update({
      status: input.decision,
      reviewed_at: reviewedAt,
      reviewed_by: input.customerId,
    })
    .eq('id', input.requestId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    throw new Error(formatDbError(updateError, 'Failed to update reschedule request.'));
  }

  if (input.decision === 'approved') {
    const scheduledAt = parseProposedSchedule(request.proposed_date, request.proposed_time);
    if (!scheduledAt) {
      throw new Error('The proposed reschedule time is invalid.');
    }

    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        scheduled_at: scheduledAt,
      })
      .eq('id', input.bookingId)
      .eq('customer_id', input.customerId);

    if (bookingUpdateError) {
      throw new Error(formatDbError(bookingUpdateError, 'Failed to update booking schedule.'));
    }
  }

  return updatedRequest as BookingRescheduleRequestRow;
};

export const reviewAdditionalChargeRequest = async (input: {
  bookingId: string;
  customerId: string;
  chargeIds: string[];
  decision: 'approved' | 'declined';
}) => {
  const chargeIds = input.chargeIds.map((id) => String(id).trim()).filter(Boolean);
  if (!chargeIds.length) {
    throw new Error('No additional charges were selected.');
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id,customer_id,total_amount')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(formatDbError(bookingError, 'Failed to verify booking ownership.'));
  }
  if (!booking || String(booking.customer_id) !== String(input.customerId)) {
    throw new Error('You can only review charges for your own booking.');
  }

  const { data: charges, error: chargesError } = await supabase
    .from('additional_charges')
    .select('*')
    .eq('booking_id', input.bookingId)
    .in('id', chargeIds);

  if (chargesError) {
    throw new Error(formatDbError(chargesError, 'Failed to load additional charges.'));
  }

  const reviewedAt = new Date().toISOString();
  const { data: updatedCharges, error: updateError } = await supabase
    .from('additional_charges')
    .update({
      status: input.decision,
      reviewed_at: reviewedAt,
      reviewed_by: input.customerId,
    })
    .in('id', chargeIds)
    .eq('booking_id', input.bookingId)
    .select('*');

  if (updateError) {
    throw new Error(formatDbError(updateError, 'Failed to update additional charges.'));
  }

  if (input.decision === 'approved') {
    const approvedAmount = (charges || []).reduce(
      (sum, charge) => sum + Number(charge.amount || 0),
      0
    );
    const nextTotalAmount = Number(booking.total_amount || 0) + approvedAmount;

    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        total_amount: nextTotalAmount,
      })
      .eq('id', input.bookingId)
      .eq('customer_id', input.customerId);

    if (bookingUpdateError) {
      throw new Error(formatDbError(bookingUpdateError, 'Failed to update booking total.'));
    }

    const payment = await getPaymentByBookingId(input.bookingId);
    if (payment && String(payment.status || '').toLowerCase() !== 'paid') {
      await updateBookingPaymentAmount(input.bookingId, nextTotalAmount);
    }
  }

  return (updatedCharges || []) as AdditionalChargeRow[];
};
