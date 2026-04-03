import { Injectable, Inject, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT, CATALOG_CLIENT, BOOKING_CLIENT, PAYMENT_CLIENT, TRUST_CLIENT } from '../../database/supabase.module';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import 'multer';

@Injectable()
export class ProviderService {
  constructor(
    private readonly supabase: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(PAYMENT_CLIENT) private readonly paymentDb: SupabaseClient,
    @Inject(TRUST_CLIENT) private readonly trustDb: SupabaseClient,
  ) {}

  // ── Existing ─────────────────────────────────────────────────────────────

  async getProviderReviews(providerId: string) {
    const { data: profile, error: profileErr } = await this.catalogDb
      .from('provider_profiles')
      .select('average_rating,total_reviews')
      .eq('user_id', providerId)
      .single();

    if (profileErr) throw new InternalServerErrorException(profileErr.message);
    if (!profile) throw new NotFoundException('Provider profile not found');

    const { data: reviews, error: reviewsErr } = await this.trustDb
      .from('reviews')
      .select('id,reviewer_id,rating,review_text,created_at')
      .eq('reviewee_id', providerId)
      .order('created_at', { ascending: false });

    if (reviewsErr) throw new InternalServerErrorException(reviewsErr.message);

    return { provider_id: providerId, average_rating: Number(profile.average_rating) || 0, total_reviews: Number(profile.total_reviews) || 0, reviews };
  }

  async getTrustScore(providerId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .select('trust_score')
      .eq('user_id', providerId)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Provider profile not found');

    return { provider_id: providerId, trust_score: Number(data.trust_score) || 0 };
  }

  async getProviderProfile(userId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .select(`user_id,business_name,verification_status,provider_documents(document_id,document_type,document_file_path,status)`)
      .eq('user_id', userId)
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Provider profile not found');

    const documentsWithUrls = await Promise.all(
      (data.provider_documents || []).map(async (doc: any) => {
        const { data: urlData } = await this.supabase.storage
          .from('verification-docs')
          .createSignedUrl(doc.document_file_path, 60);
        return { ...doc, view_url: urlData?.signedUrl || null };
      }),
    );

    return { ...data, provider_id: data.user_id, provider_documents: documentsWithUrls };
  }

  async getProviderDashboard(providerId: string) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { count: newRequests } = await this.bookingDb
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'pending');

    const { data: payouts } = await this.paymentDb
      .from('provider_payouts')
      .select('net_amount')
      .eq('provider_id', providerId)
      .gte('created_at', firstDayOfMonth);

    const totalEarnings = (payouts || []).reduce((acc: number, curr: any) => acc + Number(curr.net_amount), 0);

    return { new_job_requests: newRequests || 0, total_earnings: totalEarnings };
  }

  async reuploadKycDocument(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('A new document file is required');

    const { data: profile, error: profileErr } = await this.catalogDb
      .from('provider_profiles')
      .select('verification_status')
      .eq('user_id', userId)
      .single();

    if (profileErr || !profile) throw new NotFoundException('Provider profile not found');
    if (profile.verification_status !== 'rejected') throw new BadRequestException('Only rejected providers can reupload KYC documents');

    const filePath = `kyc/${userId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await this.supabase.storage
      .from('verification-docs')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) throw new BadRequestException(uploadError.message);

    await this.catalogDb.from('provider_documents').update({ document_file_path: filePath, status: 'pending', reject_reason: null, uploaded_at: new Date().toISOString() }).eq('provider_id', userId);
    await this.catalogDb.from('provider_profiles').update({ verification_status: 'pending' }).eq('user_id', userId);
    await this.identityDb.from('users').update({ status: 'pending' }).eq('id', userId);

    return { status: 'success', message: 'KYC document reuploaded. Application is back under pending review.' };
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  async getProviderBookings(providerId: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('scheduled_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    const rows = data || [];
    if (!rows.length) return { bookings: [] };

    const customerIds = [...new Set(rows.map((b: any) => b.customer_id).filter(Boolean))];
    const serviceIds = [...new Set(rows.map((b: any) => b.service_id).filter(Boolean))];

    const [{ data: customers }, { data: services }] = await Promise.all([
      customerIds.length ? this.identityDb.from('users').select('id,full_name,contact_number').in('id', customerIds) : Promise.resolve({ data: [] }),
      serviceIds.length ? this.catalogDb.from('provider_services').select('id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode').in('id', serviceIds) : Promise.resolve({ data: [] }),
    ]);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));
    const serviceMap = new Map((services || []).map((s: any) => [s.id, s.title || 'Service']));

    return {
      bookings: rows.map((b: any) => ({
        ...b,
        customer_name: customerMap.get(b.customer_id)?.full_name || 'Customer',
        customer_contact: customerMap.get(b.customer_id)?.contact_number || '',
        service_title: serviceMap.get(b.service_id) || 'Service',
      })),
    };

  }

  async getProviderBookingById(bookingId: string) {
    const { data, error } = await this.bookingDb.from('bookings').select('*').eq('id', bookingId).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Booking not found.');

    const [{ data: customer }, { data: service }] = await Promise.all([
      this.identityDb.from('users').select('id,full_name,contact_number').eq('id', data.customer_id).maybeSingle(),
      this.catalogDb.from('provider_services').select('id,title,description,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode').eq('id', data.service_id).maybeSingle(),
    ]);

    return {
      booking: {
        ...data,
        customer_name: customer?.full_name || 'Customer',
        customer_contact: customer?.contact_number || '',
        service_title: service?.title || 'Service',
        service_description: service?.description || '',
        service_price: Number(service?.price || data.total_amount || 0),
      },
    };
  }

  async updateProviderBookingStatus(bookingId: string, providerId: string, target: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .update({ status: target })
      .eq('id', bookingId)
      .eq('provider_id', providerId)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      // Fallback without provider_id check (RLS enforces ownership)
      const { data: fallback, error: fallbackErr } = await this.bookingDb
        .from('bookings')
        .update({ status: target })
        .eq('id', bookingId)
        .select('*')
        .maybeSingle();

      if (fallbackErr || !fallback) throw new BadRequestException(fallbackErr?.message || 'Failed to update booking status.');

      // Sync payment on completion/cancellation
      if (target === 'completed') {
        await this.paymentDb.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('booking_id', bookingId);
      } else if (target === 'cancelled') {
        await this.paymentDb.from('payments').update({ status: 'cancelled' }).eq('booking_id', bookingId);
      }

      return { booking: fallback };
    }

    if (target === 'completed') {
      await this.supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('booking_id', bookingId);
    } else if (target === 'cancelled') {
      await this.supabase.from('payments').update({ status: 'cancelled' }).eq('booking_id', bookingId);
    }

    return { booking: data };
  }

  // ── Reschedule Requests ───────────────────────────────────────────────────

  async createRescheduleRequest(input: { bookingId: string; providerId: string; reason: string; explanation: string; proposedDate: string; proposedTime: string }) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .insert({ booking_id: input.bookingId, provider_id: input.providerId, reason: input.reason, explanation: input.explanation, proposed_date: input.proposedDate, proposed_time: input.proposedTime, status: 'pending' })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { request: data };
  }

  async getRescheduleRequests(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { requests: data || [] };
  }

  async reviewRescheduleRequest(input: { requestId: string; bookingId: string; customerId: string; decision: 'approved' | 'declined' }) {
    const { data: request, error: reqErr } = await this.bookingDb
      .from('booking_reschedule_requests')
      .select('*')
      .eq('id', input.requestId)
      .eq('booking_id', input.bookingId)
      .maybeSingle();

    if (reqErr || !request) throw new NotFoundException('Reschedule request not found.');

    const { data: updatedRequest, error: updateErr } = await this.bookingDb
      .from('booking_reschedule_requests')
      .update({ status: input.decision, reviewed_at: new Date().toISOString(), reviewed_by: input.customerId })
      .eq('id', input.requestId)
      .select('*')
      .maybeSingle();

    if (updateErr) throw new BadRequestException(updateErr.message);

    if (input.decision === 'approved') {
      const dateStr = `${request.proposed_date}T${request.proposed_time}`;
      const scheduledAt = new Date(dateStr).toISOString();
      await this.bookingDb.from('bookings').update({ scheduled_at: scheduledAt }).eq('id', input.bookingId);
    }

    return { request: updatedRequest };
  }

  // ── Additional Charges ────────────────────────────────────────────────────

  async createAdditionalChargeRequest(input: { bookingId: string; providerId: string; justification: string; items: { description: string; amount: number }[] }) {
    if (!input.items.length) throw new BadRequestException('At least one charge item is required.');

    const payload = input.items.map((item) => ({
      booking_id: input.bookingId,
      requested_by: input.providerId,
      description: item.description,
      amount: Number(item.amount || 0),
      justification: input.justification,
      status: 'pending',
    }));

    const { data, error } = await this.bookingDb.from('additional_charges').insert(payload).select('*');
    if (error) throw new BadRequestException(error.message);
    return { charges: data || [] };
  }

  async getAdditionalChargeRequests(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('additional_charges')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { charges: data || [] };
  }

  async reviewAdditionalChargeRequest(input: { bookingId: string; customerId: string; chargeIds: string[]; decision: 'approved' | 'declined' }) {
    const { data: booking } = await this.bookingDb.from('bookings').select('id,customer_id,total_amount').eq('id', input.bookingId).maybeSingle();
    if (!booking || String(booking.customer_id) !== String(input.customerId)) throw new BadRequestException('You can only review charges for your own booking.');

    const { data: charges } = await this.bookingDb.from('additional_charges').select('*').eq('booking_id', input.bookingId).in('id', input.chargeIds);

    const { data: updatedCharges, error } = await this.bookingDb
      .from('additional_charges')
      .update({ status: input.decision, reviewed_at: new Date().toISOString(), reviewed_by: input.customerId })
      .in('id', input.chargeIds)
      .eq('booking_id', input.bookingId)
      .select('*');

    if (error) throw new BadRequestException(error.message);

    if (input.decision === 'approved') {
      const approvedAmount = (charges || []).reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
      const nextTotal = Number(booking.total_amount || 0) + approvedAmount;
      await this.bookingDb.from('bookings').update({ total_amount: nextTotal }).eq('id', input.bookingId);
      await this.paymentDb.from('payments').update({ amount: nextTotal }).eq('booking_id', input.bookingId).neq('status', 'paid');
    }

    return { charges: updatedCharges || [] };
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async submitReview(input: {
    booking_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    review_text?: string;
  }) {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    const { data: booking } = await this.bookingDb
      .from('bookings')
      .select('id, status, customer_id, provider_id')
      .eq('id', input.booking_id)
      .maybeSingle();

    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status !== 'completed') {
      throw new BadRequestException('Reviews can only be submitted for completed bookings.');
    }

    const { data: existing } = await this.trustDb
      .from('reviews')
      .select('id')
      .eq('booking_id', input.booking_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle();

    if (existing) throw new BadRequestException('You have already reviewed this booking.');

    const { data: review, error } = await this.trustDb
      .from('reviews')
      .insert([{
        booking_id: input.booking_id,
        reviewer_id: input.reviewer_id,
        reviewee_id: input.reviewee_id,
        rating: input.rating,
        review_text: input.review_text || null,
      }])
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    const { data: allReviews } = await this.trustDb
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', input.reviewee_id);

    const total = (allReviews || []).length;
    const average = total
      ? (allReviews || []).reduce((sum: number, r: any) => sum + Number(r.rating), 0) / total
      : input.rating;

    await this.catalogDb
      .from('provider_profiles')
      .update({
        average_rating: Math.round(average * 10) / 10,
        total_reviews: total,
      })
      .eq('user_id', input.reviewee_id);

    return { message: 'Review submitted successfully.', review };
  }

  // ── Provider Profile Draft ────────────────────────────────────────────────

  async getProviderProfileDraft(userId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return { draft: data || null };
  }

  async saveProviderProfileDraft(userId: string, draft: Record<string, any>) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .upsert({ user_id: userId, ...draft }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .upsert({
        user_id: userId,
        ...dto,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
