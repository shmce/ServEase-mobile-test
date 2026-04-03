import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import { BOOKING_CLIENT, PAYMENT_CLIENT } from '../../../database/supabase.module';
import { BookingCreatedEvent, BOOKING_EVENTS } from '../events/booking.events';
import { withRetry } from '../../../common/utils/resilience.utils';

@Injectable()
export class BookingListeners {
  private readonly logger = new Logger(BookingListeners.name);

  constructor(
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(PAYMENT_CLIENT) private readonly paymentDb: SupabaseClient,
  ) {}

  @OnEvent(BOOKING_EVENTS.CREATED)
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.logger.log(`Handling booking identification for: ${event.bookingReference}`);

    try {
      // 1. Create Conversation (Internal side-effect)
      await withRetry(async () => {
        const { error } = await this.bookingDb.from('conversations').insert([{
          booking_id: event.bookingId,
          customer_id: event.customerId,
          provider_id: event.dto.provider_id,
          service_id: event.dto.service_id,
          last_message_text: 'Booking created. Start a conversation.',
          last_message_at: new Date().toISOString(),
        }]);
        if (error) throw error;
      });

      // 2. Create Payment Record (Cross-schema side-effect)
      await withRetry(async () => {
        const { error } = await this.paymentDb.from('payments').insert([{
          booking_id: event.bookingId,
          customer_id: event.customerId,
          provider_id: event.dto.provider_id,
          amount: event.totalAmount,
          method: 'cash',
          status: 'pending',
          transaction_reference: `PAY-${Date.now()}`,
        }]);
        if (error) throw error;
      });

      this.logger.log(`Post-booking actions completed for ${event.bookingReference}`);
    } catch (error) {
      this.logger.error(`Failed to complete post-booking actions for ${event.bookingReference}: ${error.message}`);
      // In a real microservices scenario, we would trigger a saga compensation or retry mechanism here.
    }
  }
}
