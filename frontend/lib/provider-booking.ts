import { supabase } from '@/lib/supabase';

type CustomerProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

type BookingRow = {
  id: string;
  customer_id?: string | null;
  provider_id?: string | null;
  service_name?: string | null;
  address?: string | null;
  scheduled_at?: string | null;
  created_at?: string | null;
  total_price?: number | null;
  status?: string | null;
  notes?: string | null;
  rating?: number | null;
  commission_fee?: number | null;
  net_earnings?: number | null;
};

export type ProviderBookingView = {
  id: string;
  customerId: string | null;
  customer: string;
  avatar: string;
  customerPhone: string;
  service: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  address: string;
  amount: string;
  priceRaw: number;
  status: string;
  statusRaw: string;
  createdAt: string | null;
  scheduledAt: string | null;
  rating: number;
  commissionFee: number;
  netEarnings: number;
  notes: string;
};

const FALLBACK_AVATAR = 'https://via.placeholder.com/150';

function formatStatus(status?: string | null) {
  const statusRaw = status || 'pending';
  return {
    statusRaw,
    status: statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).replace(/_/g, ' '),
  };
}

function formatDateParts(dateValue?: string | null) {
  const baseDate = dateValue ? new Date(dateValue) : new Date();

  return {
    date: baseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: baseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function normalizeBooking(record: BookingRow, customerProfile?: CustomerProfile | null): ProviderBookingView {
  const priceRaw = record.total_price || 0;
  const commissionFee = record.commission_fee ?? Math.round(priceRaw * 0.1);
  const netEarnings = record.net_earnings ?? Math.max(priceRaw - commissionFee, 0);
  const { status, statusRaw } = formatStatus(record.status);
  const { date, time } = formatDateParts(record.scheduled_at || record.created_at);

  return {
    id: record.id,
    customerId: record.customer_id || null,
    customer: customerProfile?.full_name || 'Customer',
    avatar: customerProfile?.avatar_url || FALLBACK_AVATAR,
    customerPhone: customerProfile?.phone || 'Unverified',
    service: record.service_name || 'Service',
    description: record.notes || record.service_name || 'Service booking',
    date,
    time,
    duration: '2h 45m',
    address: record.address || 'Consultation',
    amount: priceRaw.toLocaleString(),
    priceRaw,
    status,
    statusRaw,
    createdAt: record.created_at || null,
    scheduledAt: record.scheduled_at || null,
    rating: record.rating || 0,
    commissionFee,
    netEarnings,
    notes: record.notes || '',
  };
}

function coerceId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

async function fetchCustomerProfiles(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, CustomerProfile>();
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, phone')
    .in('id', customerIds);

  if (error || !data) {
    return new Map<string, CustomerProfile>();
  }

  return new Map<string, CustomerProfile>(
    data.map((profile) => [
      profile.id as string,
      {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
      },
    ]),
  );
}

export async function fetchProviderBookingViews(providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    throw error || new Error('Failed to fetch bookings');
  }

  const customerIds = Array.from(
    new Set(
      data
        .map((booking) => booking.customer_id)
        .filter((customerId): customerId is string => Boolean(customerId)),
    ),
  );

  const profilesById = await fetchCustomerProfiles(customerIds);

  return data.map((booking) =>
    normalizeBooking(booking as BookingRow, profilesById.get(booking.customer_id || '')),
  );
}

export async function fetchProviderBookingView(idParam: string | string[] | undefined) {
  const bookingId = coerceId(idParam);

  if (!bookingId) {
    return null;
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    throw error || new Error('Failed to fetch booking');
  }

  let customerProfile: CustomerProfile | null = null;

  if (data.customer_id) {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url, phone')
      .eq('id', data.customer_id)
      .maybeSingle();

    customerProfile = profileData || null;
  }

  return normalizeBooking(data as BookingRow, customerProfile);
}
