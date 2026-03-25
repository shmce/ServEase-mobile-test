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

