import { api } from '../lib/apiClient';
import { Booking, EnrichedBooking } from '../src/types/database.interfaces';

export const getCustomerBookings = async (customerId: string): Promise<EnrichedBooking[]> => {
  const { bookings } = await api.get<{ bookings: EnrichedBooking[] }>(`/booking/customer/${customerId}`);
  return bookings;
};

export const createBooking = async (bookingData: any) => {
  const inserted = await api.post<{ booking: Booking }>('/booking/create', {
    provider_id: bookingData.provider_id,
    service_id: bookingData.service_id,
    service_address: bookingData.service_address || bookingData.address || '',
    scheduled_at: parseScheduleLocal(
      String(bookingData.scheduled_date_key || bookingData.scheduled_date || '').trim(),
      String(bookingData.scheduled_time || '').trim()
    )?.toISOString(),
    pricing_mode: bookingData.pricing_mode || 'flat_rate',
    hourly_rate: bookingData.hourly_rate,
    flat_rate: bookingData.flat_rate,
    hours_required: bookingData.hours_required,
  });

  return inserted.booking;
};

export const getBookingById = async (bookingId: string): Promise<EnrichedBooking> => {
  const { booking } = await api.get<{ booking: EnrichedBooking }>(`/booking/${bookingId}`);
  return booking;
};

export const cancelCustomerBooking = async (
  bookingId: string,
  _customerId: string,
  reason: string,
  explanation: string
) => {
  const { booking } = await api.patch<{ booking: Booking }>(`/booking/${bookingId}/cancel`, {
    reason,
    explanation,
  });
  return booking;
};

// ── Helpers (keep Supabase direct for notification lookups) ─────────────────

const parseTimeTo24h = (input: string) => {
  const pattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const m = pattern.exec(String(input || '').trim());
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
  const pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const ymd = pattern.exec(dateInput);
  if (ymd) {
    const dt = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), time.hours, time.minutes, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const parsedDate = new Date(dateInput);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const dt = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), time.hours, time.minutes, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};


