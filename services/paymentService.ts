import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';

export type PaymentRow = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_reference?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export type ProviderPaymentHistoryItem = PaymentRow & {
  booking_reference: string;
  customer_name: string;
  service_title: string;
  scheduled_at?: string | null;
  net_earnings: number;
  platform_fee: number;
};

export type PaymentMethod = 'cash' | 'gcash' | 'paymaya' | 'card';
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'cancelled'
  | 'refunded';

const createPaymentReference = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const tryInsertPayment = async (payload: Record<string, any>) => {
  const variants = [
    payload,
    {
      ...payload,
      transaction_reference:
        payload.transaction_reference || createPaymentReference('PAY'),
    },
    {
      booking_id: payload.booking_id,
      customer_id: payload.customer_id,
      provider_id: payload.provider_id,
      amount: payload.amount,
      method: payload.method,
      status: payload.status,
    },
  ];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(variant)
        .select(
          'id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at'
        )
        .maybeSingle();

      if (!error && data) return data as PaymentRow;
    } catch {
      // Continue through fallback shapes.
    }
  }

  return null;
};

const tryUpdatePayment = async (paymentId: string, payload: Record<string, any>) => {
  const variants = [
    payload,
    Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
  ];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(variant)
        .eq('id', paymentId)
        .select(
          'id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at'
        )
        .maybeSingle();

      if (!error && data) return data as PaymentRow;
    } catch {
      // Continue through fallback shapes.
    }
  }

  return null;
};

export const getPaymentByBookingId = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(getErrorMessage(error, 'Failed to load payment.'));
  return (data || null) as PaymentRow | null;
};

export const getProviderPayments = async (providerId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at')
    .eq('provider_id', providerId)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(getErrorMessage(error, 'Failed to load provider payments.'));
  return (data || []) as PaymentRow[];
};

export const getProviderPaymentHistory = async (providerId: string) => {
  const payments = await getProviderPayments(providerId);
  if (!payments.length) return [] as ProviderPaymentHistoryItem[];

  const bookingIds = Array.from(new Set(payments.map((payment) => payment.booking_id).filter(Boolean)));
  const customerIds = Array.from(new Set(payments.map((payment) => payment.customer_id).filter(Boolean)));

  const [{ data: bookings }, { data: customers }] = await Promise.all([
    bookingIds.length
      ? supabase
          .from('bookings')
          .select('id,booking_reference,service_id,scheduled_at')
          .in('id', bookingIds)
      : Promise.resolve({ data: [] as any[] }),
    customerIds.length
      ? supabase.from('users').select('id,full_name').in('id', customerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const serviceIds = Array.from(
    new Set((bookings || []).map((booking: any) => booking.service_id).filter(Boolean))
  );

  const { data: services } = serviceIds.length
    ? await supabase.from('provider_services').select('id,title').in('id', serviceIds)
    : { data: [] as any[] };

  const bookingMap = new Map((bookings || []).map((booking: any) => [String(booking.id), booking]));
  const customerMap = new Map((customers || []).map((customer: any) => [String(customer.id), customer.full_name || 'Customer']));
  const serviceMap = new Map((services || []).map((service: any) => [String(service.id), service.title || 'Service']));

  return payments.map((payment) => {
    const booking = bookingMap.get(String(payment.booking_id));
    const platformFee = Number(payment.amount || 0) * 0.1;
    return {
      ...payment,
      booking_reference: String(booking?.booking_reference || payment.booking_id || payment.id),
      customer_name: customerMap.get(String(payment.customer_id)) || 'Customer',
      service_title: serviceMap.get(String(booking?.service_id || '')) || 'Service',
      scheduled_at: booking?.scheduled_at || null,
      platform_fee: platformFee,
      net_earnings: Number(payment.amount || 0) - platformFee,
    };
  });
};

export const getProviderEarningsSummary = async (providerId: string) => {
  const payments = await getProviderPaymentHistory(providerId);
  const paidPayments = payments.filter((payment) => String(payment.status).toLowerCase() === 'paid');
  const pendingPayments = payments.filter((payment) => {
    const status = String(payment.status).toLowerCase();
    return status === 'pending' || status === 'authorized';
  });

  const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalNetEarnings = paidPayments.reduce((sum, payment) => sum + payment.net_earnings, 0);
  const pendingRevenue = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const cashOnHand = paidPayments
    .filter((payment) => String(payment.method).toLowerCase() === 'cash')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const averagePerService = paidPayments.length ? totalNetEarnings / paidPayments.length : 0;

  return {
    payments,
    paidPayments,
    totalRevenue,
    totalNetEarnings,
    pendingRevenue,
    cashOnHand,
    averagePerService,
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length,
  };
};

export const getPaymentStatusLabel = (statusRaw?: string | null) => {
  const status = String(statusRaw || '').trim().toLowerCase();

  if (status === 'paid') return 'Paid';
  if (status === 'authorized') return 'Authorized';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'refunded') return 'Refunded';
  if (!status || status === 'pending') return 'Pending';
  return statusRaw || 'Pending';
};

export const getPaymentMethodLabel = (methodRaw?: string | null) => {
  const method = String(methodRaw || '').trim().toLowerCase();

  if (method === 'gcash') return 'GCash';
  if (method === 'paymaya') return 'PayMaya';
  if (method === 'card') return 'Card';
  if (!method || method === 'cash') return 'Cash on Service';
  return methodRaw || 'Cash on Service';
};

export const ensureBookingPayment = async (input: {
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  method?: PaymentMethod;
}) => {
  const existing = await getPaymentByBookingId(input.bookingId);
  if (existing) return existing;

  const payment = await tryInsertPayment({
    booking_id: input.bookingId,
    customer_id: input.customerId,
    provider_id: input.providerId,
    amount: Number(input.amount || 0),
    method: input.method || 'cash',
    status: 'pending',
    transaction_reference: createPaymentReference('PAY'),
  });

  if (!payment) {
    throw new Error('Failed to create payment record for booking.');
  }

  return payment;
};

export const markBookingPaymentPaid = async (input: {
  bookingId: string;
  amount?: number;
  customerId?: string;
  providerId?: string;
  method?: PaymentMethod;
}) => {
  const now = new Date().toISOString();
  const existing = await getPaymentByBookingId(input.bookingId);

  if (!existing) {
    return ensureBookingPayment({
      bookingId: input.bookingId,
      customerId: String(input.customerId || ''),
      providerId: String(input.providerId || ''),
      amount: Number(input.amount || 0),
      method: input.method || 'cash',
    }).then(async (created) => {
      const updated = await tryUpdatePayment(created.id, {
        status: 'paid',
        paid_at: now,
        transaction_reference:
          created.transaction_reference || createPaymentReference('PAID'),
      });

      return updated || created;
    });
  }

  const updated = await tryUpdatePayment(existing.id, {
    status: 'paid',
    paid_at: now,
    method: input.method || existing.method || 'cash',
    transaction_reference:
      existing.transaction_reference || createPaymentReference('PAID'),
  });

  if (!updated) {
    throw new Error('Failed to update payment as paid.');
  }

  return updated;
};

export const cancelBookingPayment = async (bookingId: string) => {
  const existing = await getPaymentByBookingId(bookingId);
  if (!existing) return null;

  const updated = await tryUpdatePayment(existing.id, {
    status: 'cancelled',
  });

  if (!updated) {
    throw new Error('Failed to cancel payment record.');
  }

  return updated;
};

export const updateBookingPaymentAmount = async (bookingId: string, amount: number) => {
  const existing = await getPaymentByBookingId(bookingId);
  if (!existing) return null;

  const updated = await tryUpdatePayment(existing.id, {
    amount: Number(amount || 0),
  });

  if (!updated) {
    throw new Error('Failed to update payment amount.');
  }

  return updated;
};

