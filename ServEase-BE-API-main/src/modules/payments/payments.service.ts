import { Injectable, Inject, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { PAYMENT_CLIENT, BOOKING_CLIENT, IDENTITY_CLIENT, CATALOG_CLIENT } from '../../database/supabase.module';
import { CreatePaymentDto } from './dto/create-payment.dto';

const createRef = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_CLIENT) private readonly paymentDb: SupabaseClient,
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
  ) {}

  async createPayment(dto: CreatePaymentDto) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .insert([{
        booking_id: dto.booking_id,
        customer_id: dto.customer_id,
        provider_id: dto.provider_id,
        amount: dto.amount,
        method: dto.method,
        status: dto.status || 'pending',
        paid_at: dto.status === 'completed' ? new Date().toISOString() : null,
        transaction_reference: dto.transaction_reference || null,
      }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'success', message: 'Payment processed.', data };
  }

  async getPaymentByBookingId(bookingId: string) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .select('id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return { payment: data || null };
  }

  async getProviderPaymentHistory(providerId: string) {
    const { data: payments, error } = await this.paymentDb
      .from('payments')
      .select('id,booking_id,customer_id,provider_id,amount,method,status,transaction_reference,paid_at,created_at')
      .eq('provider_id', providerId)
      .order('paid_at', { ascending: false, nullsFirst: false });

    if (error) throw new BadRequestException(error.message);
    const rows = payments || [];
    if (!rows.length) return { payments: [] };

    const bookingIds = [...new Set(rows.map((p: any) => p.booking_id).filter(Boolean))];
    const customerIds = [...new Set(rows.map((p: any) => p.customer_id).filter(Boolean))];

    const [{ data: bookings }, { data: customers }] = await Promise.all([
      bookingIds.length ? this.bookingDb.from('bookings').select('id,booking_reference,service_id,scheduled_at').in('id', bookingIds) : Promise.resolve({ data: [] }),
      customerIds.length ? this.identityDb.from('users').select('id,full_name').in('id', customerIds) : Promise.resolve({ data: [] }),
    ]);

    const serviceIds = [...new Set((bookings || []).map((b: any) => b.service_id).filter(Boolean))];
    const { data: services } = serviceIds.length
      ? await this.catalogDb.from('provider_services').select('id,title').in('id', serviceIds)
      : { data: [] as any[] };

    const bookingMap = new Map((bookings || []).map((b: any) => [String(b.id), b]));
    const customerMap = new Map((customers || []).map((c: any) => [String(c.id), c.full_name || 'Customer']));
    const serviceMap = new Map((services || []).map((s: any) => [String(s.id), s.title || 'Service']));

    const history = rows.map((p: any) => {
      const booking = bookingMap.get(String(p.booking_id));
      const platformFee = Number(p.amount || 0) * 0.1;
      return {
        ...p,
        booking_reference: String(booking?.booking_reference || p.booking_id || p.id),
        customer_name: customerMap.get(String(p.customer_id)) || 'Customer',
        service_title: serviceMap.get(String(booking?.service_id || '')) || 'Service',
        scheduled_at: booking?.scheduled_at || null,
        platform_fee: platformFee,
        net_earnings: Number(p.amount || 0) - platformFee,
      };
    });

    return { payments: history };
  }

  async getProviderEarningsSummary(providerId: string) {
    const { payments } = await this.getProviderPaymentHistory(providerId);
    const paidPayments = (payments as any[]).filter((p) => String(p.status).toLowerCase() === 'paid');
    const pendingPayments = (payments as any[]).filter((p) => ['pending', 'authorized'].includes(String(p.status).toLowerCase()));

    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalNetEarnings = paidPayments.reduce((sum, p) => sum + p.net_earnings, 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const cashOnHand = paidPayments.filter((p) => String(p.method).toLowerCase() === 'cash').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const averagePerService = paidPayments.length ? totalNetEarnings / paidPayments.length : 0;

    return { payments, paidPayments, totalRevenue, totalNetEarnings, pendingRevenue, cashOnHand, averagePerService, paidCount: paidPayments.length, pendingCount: pendingPayments.length };
  }

  async getEarnings(providerId: string) {
    if (!providerId) throw new BadRequestException('Provider ID is required');

    const { data, error } = await this.paymentDb
      .from('payments')
      .select('amount')
      .eq('provider_id', providerId)
      .eq('status', 'completed');

    if (error) throw new InternalServerErrorException(error.message);
    const totalEarnings = (data || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    return { status: 'success', data: { provider_id: providerId, total_earnings: totalEarnings } };
  }

  async ensureBookingPayment(input: { bookingId: string; customerId: string; providerId: string; amount: number; method?: string }) {
    const { data: existing } = await this.paymentDb.from('payments').select('*').eq('booking_id', input.bookingId).maybeSingle();
    if (existing) return { payment: existing };

    const { data, error } = await this.paymentDb
      .from('payments')
      .insert([{
        booking_id: input.bookingId,
        customer_id: input.customerId,
        provider_id: input.providerId,
        amount: Number(input.amount || 0),
        method: input.method || 'cash',
        status: 'pending',
        transaction_reference: createRef('PAY'),
      }])
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return { payment: data };
  }

  async markBookingPaymentPaid(input: { bookingId: string; amount?: number; customerId?: string; providerId?: string; method?: string }) {
    const now = new Date().toISOString();
    const { data: existing } = await this.paymentDb.from('payments').select('*').eq('booking_id', input.bookingId).maybeSingle();

    if (!existing) {
      const created = await this.ensureBookingPayment({
        bookingId: input.bookingId,
        customerId: input.customerId || '',
        providerId: input.providerId || '',
        amount: input.amount || 0,
        method: input.method || 'cash',
      });
      const { data, error } = await this.paymentDb.from('payments').update({ status: 'paid', paid_at: now, transaction_reference: createRef('PAID') }).eq('id', created.payment.id).select().maybeSingle();
      if (error) throw new BadRequestException(error.message);
      return { payment: data };
    }

    const { data, error } = await this.paymentDb
      .from('payments')
      .update({ status: 'paid', paid_at: now, method: input.method || existing.method || 'cash', transaction_reference: existing.transaction_reference || createRef('PAID') })
      .eq('id', existing.id)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return { payment: data };
  }

  async cancelBookingPayment(bookingId: string) {
    const { data: existing } = await this.paymentDb.from('payments').select('*').eq('booking_id', bookingId).maybeSingle();
    if (!existing) return { payment: null };

    const { data, error } = await this.paymentDb.from('payments').update({ status: 'cancelled' }).eq('id', existing.id).select().maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return { payment: data };
  }

  async updateBookingPaymentAmount(bookingId: string, amount: number) {
    const { data: existing } = await this.paymentDb.from('payments').select('*').eq('booking_id', bookingId).maybeSingle();
    if (!existing) throw new NotFoundException('Payment not found for this booking.');

    const { data, error } = await this.paymentDb.from('payments').update({ amount: Number(amount || 0) }).eq('id', existing.id).select().maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return { payment: data };
  }
}
