import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
  BOOKING_CLIENT,
  PAYMENT_CLIENT,
  TRUST_CLIENT,
} from '../../database/supabase.module';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { handleSupabaseError } from '../../common/utils/supabase-error.handler';
import 'multer';
import {
  ProviderProfile,
  ProviderService as IProviderService,
  Booking,
  User,
  ProviderReview,
  ServiceCategory,
} from '../../common/interfaces/database.interfaces';

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
    const profileResponse = await this.catalogDb
      .from('provider_profiles')
      .select('*')
      .eq('user_id', providerId)
      .maybeSingle();

    if (profileResponse.error)
      throw new InternalServerErrorException(profileResponse.error.message);
    if (!profileResponse.data)
      throw new NotFoundException('Provider profile not found');

    const profileData = profileResponse.data as ProviderProfile;

    const { data: reviews, error: reviewsErr } = await this.trustDb
      .from('reviews')
      .select('id,reviewer_id,rating,review_text,created_at')
      .eq('reviewee_id', providerId)
      .order('created_at', { ascending: false });

    if (reviewsErr) throw new InternalServerErrorException(reviewsErr.message);

    return {
      provider_id: providerId,
      average_rating: Number(profileData.average_rating) || 0,
      total_reviews: Number(profileData.total_reviews) || 0,
      reviews: (reviews || []) as any as ProviderReview[],
    };
  }

  async getTrustScore(providerId: string) {
    const profileResponse = await this.catalogDb
      .from('provider_profiles')
      .select('*')
      .eq('user_id', providerId)
      .single();

    if (profileResponse.error)
      throw new InternalServerErrorException(profileResponse.error.message);
    if (!profileResponse.data)
      throw new NotFoundException('Provider profile not found');

    return {
      provider_id: providerId,
      trust_score: 0, // trust_score is not in the live schema, using 0 as fallback
    };
  }

  async getProviderProfile(userId: string) {
    const profileResponse = await this.catalogDb
      .from('provider_profiles')
      .select(
        `user_id,business_name,verification_status,provider_documents(document_id,document_type,document_file_path,status)`,
      )
      .eq('user_id', userId)
      .single();

    if (profileResponse.error)
      throw new BadRequestException(profileResponse.error.message);
    if (!profileResponse.data)
      throw new NotFoundException('Provider profile not found');

    const profileData = profileResponse.data as any;

    const documentsWithUrls = await Promise.all(
      (profileData.provider_documents || []).map(async (doc: any) => {
        const filePath = doc.document_file_path as string;
        const { data: urlData } = await this.supabase.storage
          .from('verification-docs')
          .createSignedUrl(filePath, 60);
        return {
          ...doc,
          view_url: urlData?.signedUrl || null,
        };
      }),
    );

    return {
      ...profileData,
      provider_id: profileData.user_id,
      provider_documents: documentsWithUrls,
    };
  }

  async getProviderDashboard(providerId: string) {
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const { count: newRequests } = await this.bookingDb
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'pending');

    const { data, error } = await this.paymentDb
      .from('provider_payouts')
      .select('net_amount')
      .eq('provider_id', providerId)
      .gte('created_at', firstDayOfMonth);

    if (error) handleSupabaseError(error, 'EarningsFetch');
    const totalEarnings = ((data as { net_amount: number }[]) || []).reduce(
      (acc: number, curr: { net_amount: number }) =>
        acc + Number(curr.net_amount),
      0,
    );

    return {
      new_job_requests: newRequests || 0,
      total_earnings: totalEarnings,
    };
  }

  async reuploadKycDocument(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('A new document file is required');

    const { data: profile, error: profileErr } = (await this.catalogDb
      .from('provider_profiles')
      .select('verification_status')
      .eq('user_id', userId)
      .single()) as { data: Partial<ProviderProfile> | null; error: any };

    if (profileErr || !profile)
      throw new NotFoundException('Provider profile not found');
    if (profile.verification_status !== 'rejected')
      throw new BadRequestException(
        'Only rejected providers can reupload KYC documents',
      );

    const filePath = `kyc/${userId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await this.supabase.storage
      .from('verification-docs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw new BadRequestException(uploadError.message);

    await this.catalogDb
      .from('provider_documents')
      .update({
        document_file_path: filePath,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
      })
      .eq('provider_id', userId);
    await this.catalogDb
      .from('provider_profiles')
      .update({ verification_status: 'pending' })
      .eq('user_id', userId);
    await this.identityDb
      .from('users')
      .update({ status: 'pending' })
      .eq('id', userId);

    return {
      status: 'success',
      message:
        'KYC document reuploaded. Application is back under pending review.',
    };
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  async getProviderBookings(providerId: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('scheduled_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    const rows = (data as Booking[]) || [];
    if (!rows.length) return { bookings: [] };

    const customerIds = [
      ...new Set(rows.map((b: Booking) => b.customer_id).filter(Boolean)),
    ];
    const serviceIds = [
      ...new Set(rows.map((b: Booking) => b.service_id).filter(Boolean)),
    ];

    const [{ data: customers }, { data: services }] = await Promise.all([
      customerIds.length
        ? this.identityDb
            .from('users')
            .select('id,full_name,contact_number')
            .in('id', customerIds)
        : Promise.resolve({ data: [] }),
      serviceIds.length
        ? this.catalogDb
            .from('provider_services')
            .select(
              'id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
            )
            .in('id', serviceIds)
        : Promise.resolve({ data: [] }),
    ]);

    const customerMap = new Map(
      ((customers as User[]) || []).map((c: Partial<User>) => [c.id, c]),
    );
    const serviceMap = new Map(
      ((services as IProviderService[]) || []).map(
        (s: Partial<IProviderService>) => [s.id, s.title || 'Service'],
      ),
    );

    return {
      bookings: rows.map((b: Booking) => ({
        ...b,
        customer_name: customerMap.get(b.customer_id)?.full_name || 'Customer',
        customer_contact: customerMap.get(b.customer_id)?.contact_number || '',
        service_title: serviceMap.get(b.service_id) || 'Service',
      })),
    };
  }

  async getProviderBookingById(bookingId: string, providerId?: string) {
    const { data, error } = (await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()) as { data: Booking | null; error: any };
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Booking not found.');
    if (providerId && String(data.provider_id) !== String(providerId)) {
      throw new ForbiddenException('You can only access your own bookings.');
    }

    const booking = data;

    const [{ data: customer }, { data: service }] = await Promise.all([
      this.identityDb
        .from('users')
        .select('id,full_name,contact_number')
        .eq('id', booking.customer_id)
        .maybeSingle(),
      this.catalogDb
        .from('provider_services')
        .select(
          'id,title,description,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
        )
        .eq('id', booking.service_id)
        .maybeSingle(),
    ]);

    const customerData = customer as Partial<User>;
    const serviceData = service as Partial<IProviderService>;

    return {
      booking: {
        ...booking,
        customer_name: customerData?.full_name || 'Customer',
        customer_contact: customerData?.contact_number || '',
        service_title: serviceData?.title || 'Service',
        service_description: serviceData?.description || '',
        service_price: Number(serviceData?.price || booking.total_amount || 0),
      },
    };
  }

  async updateProviderBookingStatus(
    bookingId: string,
    providerId: string,
    target: string,
  ) {
    const { data, error } = (await this.bookingDb
      .from('bookings')
      .update({ status: target })
      .eq('id', bookingId)
      .eq('provider_id', providerId)
      .select('*')
      .maybeSingle()) as { data: Booking | null; error: any };

    if (error || !data) {
      const { data: fallback, error: fallbackErr } = (await this.bookingDb
        .from('bookings')
        .update({ status: target })
        .eq('id', bookingId)
        .select('*')
        .maybeSingle()) as { data: Booking | null; error: any };

      if (fallbackErr || !fallback)
        throw new BadRequestException(
          fallbackErr?.message || 'Failed to update booking status.',
        );

      if (target === 'completed') {
        await this.paymentDb
          .from('payments')
          .update({ status: 'completed', paid_at: new Date().toISOString() })
          .eq('booking_id', bookingId);
      } else if (target === 'cancelled') {
        await this.paymentDb
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('booking_id', bookingId);
      }

      return { booking: fallback };
    }

    if (target === 'completed') {
      await this.paymentDb
        .from('payments')
        .update({ status: 'completed', paid_at: new Date().toISOString() })
        .eq('booking_id', bookingId);
    } else if (target === 'cancelled') {
      await this.paymentDb
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId);
    }

    return { booking: data };
  }

  async getProviderServices(providerId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_services')
      .select(
        'id,title,description,price,category_id,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
      )
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { services: (data || []) as Partial<IProviderService>[] };
  }

  async saveProviderService(
    providerId: string,
    input: Record<string, any>,
    serviceId?: string,
  ) {
    const payload = {
      provider_id: providerId,
      title: String(input.title || '').trim(),
      description: input.description ? String(input.description).trim() : null,
      price: Number(input.price || 0),
      category_id: String(input.category_id || '').trim(),
      supports_hourly: Boolean(input.supports_hourly),
      hourly_rate:
        input.hourly_rate === null || input.hourly_rate === undefined
          ? null
          : Number(input.hourly_rate),
      supports_flat: Boolean(input.supports_flat),
      flat_rate:
        input.flat_rate === null || input.flat_rate === undefined
          ? null
          : Number(input.flat_rate),
      default_pricing_mode: input.default_pricing_mode || null,
      service_location_type:
        input.service_location_type === 'in_shop' ? 'in_shop' : 'mobile',
      service_location_address: input.service_location_address
        ? String(input.service_location_address).trim()
        : null,
    };

    if (!payload.title || !payload.category_id) {
      throw new BadRequestException('title and category_id are required.');
    }

    const { data: profile, error: profileError } = await this.catalogDb
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', providerId)
      .maybeSingle();

    if (profileError) throw new BadRequestException(profileError.message);
    if (!profile) {
      await this.ensureProviderIdentityRows(providerId);
    }

    if (serviceId) {
      const { data, error } = await this.catalogDb
        .from('provider_services')
        .update(payload)
        .eq('id', serviceId)
        .eq('provider_id', providerId)
        .select(
          'id,title,description,price,category_id,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
        )
        .maybeSingle();

      if (error) throw new BadRequestException(error.message);
      if (!data) throw new NotFoundException('Provider service not found.');
      return { service: data };
    }

    const { data, error } = await this.catalogDb
      .from('provider_services')
      .insert(payload)
      .select(
        'id,title,description,price,category_id,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return { service: data };
  }

  async deleteProviderService(providerId: string, serviceId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_services')
      .delete()
      .eq('id', serviceId)
      .eq('provider_id', providerId)
      .select('id')
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Provider service not found.');
    return { deleted: true };
  }

  async getProviderAvailability(providerId: string) {
    const [
      { data: weeklyRows, error: weeklyError },
      { data: daysOffRows, error: daysOffError },
    ] = await Promise.all([
      this.bookingDb
        .from('provider_availability')
        .select(
          'user_id,day_of_week,is_active,start_time,end_time,break_start_time,break_end_time',
        )
        .eq('user_id', providerId),
      this.bookingDb
        .from('provider_days_off')
        .select('id,user_id,off_date,reason')
        .eq('user_id', providerId)
        .order('off_date', { ascending: true }),
    ]);

    if (weeklyError) throw new BadRequestException(weeklyError.message);
    if (daysOffError) throw new BadRequestException(daysOffError.message);

    return {
      weeklySchedule: weeklyRows || [],
      daysOff: daysOffRows || [],
    };
  }

  async saveProviderAvailability(
    providerId: string,
    input: {
      weeklySchedule?: Record<string, any>[];
      daysOff?: Record<string, any>[];
    },
  ) {
    const weeklyPayload = (input.weeklySchedule || []).map((item) => ({
      user_id: providerId,
      day_of_week: String(item.day_of_week || ''),
      is_active: Boolean(item.is_active),
      start_time: item.start_time || null,
      end_time: item.end_time || null,
      break_start_time: item.break_start_time || null,
      break_end_time: item.break_end_time || null,
    }));

    if (weeklyPayload.length > 0) {
      const { error } = await this.bookingDb
        .from('provider_availability')
        .upsert(weeklyPayload, { onConflict: 'user_id,day_of_week' });
      if (error) throw new BadRequestException(error.message);
    }

    const { error: deleteError } = await this.bookingDb
      .from('provider_days_off')
      .delete()
      .eq('user_id', providerId);
    if (deleteError) throw new BadRequestException(deleteError.message);

    const daysOffPayload = (input.daysOff || []).map((item) => ({
      user_id: providerId,
      off_date: String(item.off_date || item.day || ''),
      reason: item.reason ? String(item.reason) : null,
    }));

    if (daysOffPayload.length > 0) {
      const { error } = await this.bookingDb
        .from('provider_days_off')
        .insert(daysOffPayload);
      if (error) throw new BadRequestException(error.message);
    }

    return this.getProviderAvailability(providerId);
  }

  private async ensureProviderIdentityRows(providerId: string) {
    const user = await this.identityDb
      .from('users')
      .select('id,full_name,email,contact_number,role')
      .eq('id', providerId)
      .maybeSingle();

    if (user.error) throw new BadRequestException(user.error.message);
    if (!user.data)
      throw new ForbiddenException('Provider identity row is missing.');

    const userData = user.data as Partial<User>;
    await this.catalogDb.from('provider_profiles').upsert({
      user_id: providerId,
      business_name: userData.full_name || 'Provider',
    });
  }

  // ── Reschedule Requests ───────────────────────────────────────────────────

  async createRescheduleRequest(input: {
    bookingId: string;
    providerId: string;
    reason: string;
    explanation: string;
    proposedDate: string;
    proposedTime: string;
  }) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .insert({
        booking_id: input.bookingId,
        provider_id: input.providerId,
        reason: input.reason,
        explanation: input.explanation,
        proposed_date: input.proposedDate,
        proposed_time: input.proposedTime,
        status: 'pending',
      })
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

  async reviewRescheduleRequest(input: {
    requestId: string;
    bookingId: string;
    customerId: string;
    decision: 'approved' | 'declined';
  }) {
    const { data: request, error: reqErr } = await this.bookingDb
      .from('booking_reschedule_requests')
      .select('*')
      .eq('id', input.requestId)
      .eq('booking_id', input.bookingId)
      .maybeSingle();

    if (reqErr || !request)
      throw new NotFoundException('Reschedule request not found.');

    const { data: updatedRequest, error: updateErr } = await this.bookingDb
      .from('booking_reschedule_requests')
      .update({
        status: input.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: input.customerId,
      })
      .eq('id', input.requestId)
      .select('*')
      .maybeSingle();

    if (updateErr) throw new BadRequestException(updateErr.message);

    if (input.decision === 'approved') {
      const reqData = request;
      const dateStr = `${reqData.proposed_date}T${reqData.proposed_time}`;
      const scheduledAt = new Date(dateStr).toISOString();
      await this.bookingDb
        .from('bookings')
        .update({ scheduled_at: scheduledAt })
        .eq('id', input.bookingId);
    }

    return { request: updatedRequest };
  }

  // ── Additional Charges ────────────────────────────────────────────────────

  async createAdditionalChargeRequest(input: {
    bookingId: string;
    providerId: string;
    justification: string;
    items: { description: string; amount: number }[];
  }) {
    if (!input.items.length)
      throw new BadRequestException('At least one charge item is required.');

    const payload = input.items.map((item) => ({
      booking_id: input.bookingId,
      requested_by: input.providerId,
      description: item.description,
      amount: Number(item.amount || 0),
      justification: input.justification,
      status: 'pending',
    }));

    const { data, error } = await this.bookingDb
      .from('additional_charges')
      .insert(payload)
      .select('*');
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

  async reviewAdditionalChargeRequest(input: {
    bookingId: string;
    customerId: string;
    chargeIds: string[];
    decision: 'approved' | 'declined';
  }) {
    const bookingResponse = await this.bookingDb
      .from('bookings')
      .select('id,customer_id,total_amount')
      .eq('id', input.bookingId)
      .maybeSingle();

    if (
      !bookingResponse.data ||
      String((bookingResponse.data as any).customer_id) !==
        String(input.customerId)
    )
      throw new BadRequestException(
        'You can only review charges for your own booking.',
      );

    const chargesResponse = await this.bookingDb
      .from('additional_charges')
      .select('*')
      .eq('booking_id', input.bookingId)
      .in('id', input.chargeIds);

    const updateResponse = await this.bookingDb
      .from('additional_charges')
      .update({
        status: input.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: input.customerId,
      })
      .in('id', input.chargeIds)
      .eq('booking_id', input.bookingId)
      .select('*');

    if (updateResponse.error)
      throw new BadRequestException(updateResponse.error.message);

    if (input.decision === 'approved' && chargesResponse.data) {
      const approvedAmount = chargesResponse.data.reduce(
        (sum: number, c: { amount: number }) => sum + Number(c.amount || 0),
        0,
      );
      const nextTotal =
        Number((bookingResponse.data as any).total_amount || 0) +
        approvedAmount;
      await this.bookingDb
        .from('bookings')
        .update({ total_amount: nextTotal })
        .eq('id', input.bookingId);
      await this.paymentDb
        .from('payments')
        .update({ amount: nextTotal })
        .eq('booking_id', input.bookingId)
        .neq('status', 'completed');
    }

    return { charges: updateResponse.data || [] };
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async submitProviderReport(input: {
    providerId: string;
    reporterId: string;
    bookingId?: string;
    reason: string;
    details?: string;
  }) {
    if (!input.providerId || !input.reporterId) {
      throw new BadRequestException('Missing provider or reporter details.');
    }
    if (!input.reason) {
      throw new BadRequestException('Please choose a report reason.');
    }

    const { data, error } = await this.trustDb
      .from('provider_profile_reports')
      .insert({
        provider_id: input.providerId,
        reporter_id: input.reporterId,
        booking_id: input.bookingId || null,
        reason: input.reason,
        details: input.details || null,
        status: 'submitted',
      })
      .select('*')
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data;
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

    const { data: bookingData } = await this.bookingDb
      .from('bookings')
      .select('id, status, customer_id, provider_id')
      .eq('id', input.booking_id)
      .maybeSingle();

    const booking = bookingData as Pick<
      Booking,
      'id' | 'status' | 'customer_id' | 'provider_id'
    > | null;
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status !== 'completed') {
      throw new BadRequestException(
        'Reviews can only be submitted for completed bookings.',
      );
    }

    const reviewResponse = await this.trustDb
      .from('reviews')
      .select('id')
      .eq('booking_id', input.booking_id)
      .eq('reviewer_id', input.reviewer_id)
      .maybeSingle();

    if (reviewResponse.data)
      throw new BadRequestException('You have already reviewed this booking.');

    const { data: review, error } = await this.trustDb
      .from('reviews')
      .insert([
        {
          booking_id: input.booking_id,
          reviewer_id: input.reviewer_id,
          reviewee_id: input.reviewee_id,
          rating: input.rating,
          review_text: input.review_text || null,
        },
      ])
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    const { data: allReviews } = await this.trustDb
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', input.reviewee_id);

    const reviewsList = (allReviews as any[]) || [];
    const total = reviewsList.length;
    const average = total
      ? reviewsList.reduce(
          (sum: number, r: { rating: number }) => sum + Number(r.rating),
          0,
        ) / total
      : input.rating;

    await this.catalogDb
      .from('provider_profiles')
      .update({
        average_rating: Math.round(average * 10) / 10,
        total_reviews: total,
      })
      .eq('user_id', input.reviewee_id);

    return {
      message: 'Review submitted successfully.',
      review: review as ProviderReview,
    };
  }

  // ── Provider Profile Draft ────────────────────────────────────────────────

  async getProviderProfileDraft(userId: string) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'ProviderProfileDraft');
    return { draft: (data as ProviderProfile) || null };
  }

  async saveProviderProfileDraft(userId: string, draft: Record<string, any>) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .upsert({ user_id: userId, ...draft }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) handleSupabaseError(error, 'ProviderProfileDraftSave');
    return data as ProviderProfile;
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const { data, error } = await this.catalogDb
      .from('provider_profiles')
      .upsert(
        {
          user_id: userId,
          ...dto,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .maybeSingle();

    if (error) handleSupabaseError(error, 'ProviderProfileUpdate');
    return data as ProviderProfile;
  }
}
