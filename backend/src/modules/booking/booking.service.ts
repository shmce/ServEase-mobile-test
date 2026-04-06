import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_CLIENT,
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
  PAYMENT_CLIENT,
  NOTIFICATION_CLIENT,
} from '../../database/supabase.module';
import { CreateBookingDto } from './dto/create-booking.dto';
import { getResult, getMaybeSingle } from '../../common/utils/database.utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  BookingStatusUpdatedEvent,
  BOOKING_EVENTS,
} from './events/booking.events';
import {
  Booking,
  User,
  ProviderProfile,
  ProviderService as IProviderService,
  Dispute,
} from '../../common/interfaces/database.interfaces';

type BookingListRow = Pick<
  Booking,
  | 'id'
  | 'booking_reference'
  | 'provider_id'
  | 'service_id'
  | 'scheduled_at'
  | 'status'
  | 'total_amount'
  | 'created_at'
  | 'service_address'
  | 'service_location_type'
>;

@Injectable()
export class BookingService {
  constructor(
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(PAYMENT_CLIENT) private readonly paymentDb: SupabaseClient,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationDb: SupabaseClient,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createBooking(dto: CreateBookingDto, customerId: string) {
    const { serviceRecord } = await this.validateBookingRequest(dto);

    const { totalAmount, hourlyRate, flatRate, hoursRequired } =
      this.calculateBookingAmount(dto, serviceRecord);

    const newBooking = await getResult<
      Pick<Booking, 'id' | 'booking_reference' | 'status' | 'total_amount'>
    >(
      this.bookingDb
        .from('bookings')
        .insert([
          {
            customer_id: customerId,
            provider_id: dto.provider_id,
            service_id: dto.service_id,
            booking_reference: `BKG-${Math.floor(100000 + Math.random() * 900000)}`,
            service_address: dto.service_address,
            service_location_type: dto.service_location_type,
            scheduled_at: dto.scheduled_at,
            pricing_mode: dto.pricing_mode,
            hourly_rate: hourlyRate,
            flat_rate: flatRate,
            hours_required: hoursRequired,
            total_amount: totalAmount,
            status: 'pending',
          },
        ])
        .select('id, booking_reference, status, total_amount')
        .single(),
      'BookingInsert',
    );

    // Emit event for asynchronous side-effects (conversation, payment)
    this.eventEmitter.emit(
      BOOKING_EVENTS.CREATED,
      new BookingCreatedEvent(
        newBooking.id,
        newBooking.booking_reference,
        customerId,
        totalAmount,
        dto,
      ),
    );

    return {
      message: 'Booking created successfully.',
      booking: newBooking as Booking,
    };
  }

  private async validateBookingRequest(dto: CreateBookingDto) {
    const userRecord = await getResult<Pick<User, 'role' | 'status'>>(
      this.identityDb
        .from('users')
        .select('role, status')
        .eq('id', dto.provider_id)
        .single(),
      'ProviderLookup',
      { notFoundMessage: 'Provider not found.' },
    );

    if (userRecord.role !== 'provider') {
      throw new BadRequestException(
        'Bookings can only be made with registered providers.',
      );
    }

    const profileRecord = await getResult<
      Pick<ProviderProfile, 'verification_status'>
    >(
      this.catalogDb
        .from('provider_profiles')
        .select('verification_status')
        .eq('user_id', dto.provider_id)
        .single(),
      'ProviderProfile',
      { notFoundMessage: 'Provider profile missing.' },
    );

    if (
      userRecord.status !== 'active' ||
      profileRecord.verification_status !== 'approved'
    ) {
      throw new BadRequestException('Provider is not fully verified.');
    }

    const serviceRecord = await getResult<
      Pick<
        IProviderService,
        | 'id'
        | 'provider_id'
        | 'supports_hourly'
        | 'hourly_rate'
        | 'supports_flat'
        | 'flat_rate'
        | 'service_location_type'
        | 'service_location_address'
      >
    >(
      this.catalogDb
        .from('provider_services')
        .select(
          'id,provider_id,supports_hourly,hourly_rate,supports_flat,flat_rate,service_location_type,service_location_address',
        )
        .eq('id', dto.service_id)
        .single(),
      'ServiceLookup',
      { notFoundMessage: 'Service not found.' },
    );

    if (serviceRecord.provider_id !== dto.provider_id) {
      throw new BadRequestException(
        'Service does not belong to the selected provider.',
      );
    }

    if (
      (serviceRecord.service_location_type || 'mobile') !==
      dto.service_location_type
    ) {
      throw new BadRequestException(
        'Booking location type does not match the current service configuration.',
      );
    }

    if (
      dto.service_location_type === 'in_shop' &&
      (!serviceRecord.service_location_address ||
        !String(serviceRecord.service_location_address).trim())
    ) {
      throw new BadRequestException(
        'This in-shop service is missing a provider address.',
      );
    }

    if (dto.service_location_type === 'in_shop') {
      const normalizedDtoAddress = String(dto.service_address || '')
        .trim()
        .toLowerCase();
      const normalizedServiceAddress = String(
        serviceRecord.service_location_address || '',
      )
        .trim()
        .toLowerCase();
      if (normalizedDtoAddress !== normalizedServiceAddress) {
        throw new BadRequestException(
          'In-shop booking address must match the provider service address.',
        );
      }
    }

    return { userRecord, profileRecord, serviceRecord };
  }

  private calculateBookingAmount(
    dto: CreateBookingDto,
    serviceRecord: Pick<
      IProviderService,
      'supports_hourly' | 'hourly_rate' | 'supports_flat' | 'flat_rate'
    >,
  ) {
    let totalAmount = 0;
    let hourlyRate: number | null = null;
    let flatRate: number | null = null;
    let hoursRequired: number | null = null;

    if (dto.pricing_mode === 'hourly') {
      if (!serviceRecord.supports_hourly || !serviceRecord.hourly_rate) {
        throw new BadRequestException(
          'This service does not support hourly pricing.',
        );
      }
      hourlyRate = Number(serviceRecord.hourly_rate);
      hoursRequired = Math.max(1, Number(dto.hours_required || 1));
      totalAmount = hourlyRate * hoursRequired;
    } else {
      if (!serviceRecord.supports_flat || !serviceRecord.flat_rate) {
        throw new BadRequestException(
          'This service does not support flat pricing.',
        );
      }
      flatRate = Number(serviceRecord.flat_rate);
      totalAmount = flatRate;
    }

    return { totalAmount, hourlyRate, flatRate, hoursRequired };
  }

  async getCustomerBookings(customerId: string) {
    const rows = await getResult<BookingListRow[]>(
      this.bookingDb
        .from('bookings')
        .select(
          'id, booking_reference, provider_id, service_id, scheduled_at, status, total_amount, created_at, service_address, service_location_type',
        )
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),
      'BookingsFetch',
      { allowEmpty: true },
    );
    if (!rows.length) return { bookings: [] };

    const providerIds = [
      ...new Set(
        rows.map((bookingRow) => bookingRow.provider_id).filter(Boolean),
      ),
    ];
    const serviceIds = [
      ...new Set(
        rows.map((bookingRow) => bookingRow.service_id).filter(Boolean),
      ),
    ];

    const [{ data: providers }, { data: services }] = await Promise.all([
      providerIds.length
        ? this.identityDb
            .from('users')
            .select('id,full_name,contact_number')
            .in('id', providerIds)
        : Promise.resolve({ data: [], error: null }),
      serviceIds.length
        ? this.catalogDb
            .from('provider_services')
            .select('id,title,price')
            .in('id', serviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const providerMap = new Map(
      (providers || []).map((p: Partial<User>) => [p.id, p]),
    );
    const serviceMap = new Map(
      (services || []).map((s: Partial<IProviderService>) => [s.id, s]),
    );

    return {
      bookings: rows.map((bookingRow) => ({
        ...bookingRow,
        provider: providerMap.get(bookingRow.provider_id) || null,
        service: serviceMap.get(bookingRow.service_id) || null,
      })),
    };
  }

  private isUuid(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async getBookingById(bookingId: string) {
    const isUuid = this.isUuid(bookingId);
    const booking = await getResult<Booking>(
      this.bookingDb
        .from('bookings')
        .select(
          'id, booking_reference, provider_id, service_id, scheduled_at, status, total_amount, cancellation_reason, cancellation_explanation, service_address, service_location_type',
        )
        .eq(isUuid ? 'id' : 'booking_reference', bookingId)
        .single(),
      'BookingDetail',
      { notFoundMessage: `Booking not found for: ${bookingId}` },
    );

    return { booking };
  }

  async cancelBooking(
    bookingId: string,
    customerId: string,
    reason: string,
    explanation: string,
  ) {
    const isUuid = this.isUuid(bookingId);
    let query = this.bookingDb.from('bookings').update({
      status: 'cancelled',
      cancellation_reason: reason || null,
      cancellation_explanation: explanation || null,
      cancelled_at: new Date().toISOString(),
      cancelled_by: customerId,
    });

    query = query.eq(isUuid ? 'id' : 'booking_reference', bookingId);

    const booking = await getMaybeSingle<Booking>(
      query.eq('customer_id', customerId).select('*').maybeSingle(),
      'BookingCancel',
    );

    if (!booking)
      throw new NotFoundException(
        'Booking not found or not owned by this customer.',
      );

    await this.paymentDb
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('booking_id', booking.id);

    this.eventEmitter.emit(
      BOOKING_EVENTS.CANCELLED,
      new BookingCancelledEvent(
        booking.id,
        booking.booking_reference,
        booking.customer_id,
        booking.provider_id,
        booking.service_id,
      ),
    );

    return { message: 'Booking cancelled.', booking };
  }

  async getHistory() {
    const history = await getResult<Partial<Booking>[]>(
      this.bookingDb
        .from('bookings')
        .select(
          'id, booking_reference, provider_id, status, total_amount, scheduled_at',
        )
        .in('status', ['completed', 'cancelled', 'disputed']),
      'BookingHistory',
      { allowEmpty: true },
    );
    return { history };
  }

  async getRequests() {
    const requests = await getResult<Partial<Booking>[]>(
      this.bookingDb
        .from('bookings')
        .select(
          'id, booking_reference, customer_id, service_id, scheduled_at, total_amount',
        )
        .eq('status', 'pending'),
      'BookingRequests',
      { allowEmpty: true },
    );
    return { requests };
  }

  async updateStatus(id: string, status: string) {
    const isUuid = this.isUuid(id);
    const data = await getMaybeSingle<Booking>(
      this.bookingDb
        .from('bookings')
        .update({ status })
        .eq(isUuid ? 'id' : 'booking_reference', id)
        .select(
          'id, status, booking_reference, customer_id, provider_id, service_id',
        )
        .maybeSingle(),
      'BookingStatusUpdate',
    );

    if (!data) throw new NotFoundException(`Booking not found for: ${id}`);

    this.eventEmitter.emit(
      BOOKING_EVENTS.STATUS_UPDATED,
      new BookingStatusUpdatedEvent(
        data.id,
        data.booking_reference,
        data.customer_id,
        data.provider_id,
        data.service_id,
        data.status,
      ),
    );

    return { message: 'Status updated.', booking: data };
  }

  // ── Attachments ───────────────────────────────────────────────────────────

  async getBookingAttachments(bookingId: string) {
    const attachments = await getResult<any[]>(
      this.bookingDb
        .from('booking_attachments')
        .select(
          'id,booking_id,file_url,file_name,mime_type,created_at,storage_path',
        )
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true }),
      'AttachmentsFetch',
      { allowEmpty: true },
    );
    return { attachments };
  }

  // ── Disputes ──────────────────────────────────────────────────────────────

  async createDispute(bookingId: string, raisedBy: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Reason is required to file a dispute.');
    }

    // Verify booking exists and get IDs
    await getResult<
      Pick<
        Booking,
        | 'id'
        | 'booking_reference'
        | 'customer_id'
        | 'provider_id'
        | 'service_id'
        | 'status'
      >
    >(
      this.bookingDb
        .from('bookings')
        .select(
          'id, booking_reference, customer_id, provider_id, service_id, status',
        )
        .eq('id', bookingId)
        .single(),
      'DisputeBookingVerify',
    );

    // Write into notification_svc disputes
    const dispute = await getResult<Dispute>(
      this.notificationDb
        .from('disputes')
        .insert({
          booking_id: bookingId,
          raised_by: raisedBy,
          reason: reason.trim(),
          status: 'open',
        })
        .select('*')
        .single(),
      'DisputeInsert',
    );

    // Optionally update booking status to disputed
    await this.updateStatus(bookingId, 'disputed');

    return { dispute };
  }
}
