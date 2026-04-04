import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_CLIENT,
  PAYMENT_CLIENT,
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
  NOTIFICATION_CLIENT,
} from '../../../database/supabase.module';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  BookingStatusUpdatedEvent,
  BOOKING_EVENTS,
} from '../events/booking.events';
import { withRetry } from '../../../common/utils/resilience.utils';
import {
  User,
  ProviderService,
} from '../../../common/interfaces/database.interfaces';

@Injectable()
export class BookingListeners {
  private readonly logger = new Logger(BookingListeners.name);

  constructor(
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(PAYMENT_CLIENT) private readonly paymentDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationDb: SupabaseClient,
  ) {}

  private async getLookupData(
    customerId: string,
    providerId: string,
    serviceId: string,
  ) {
    const [
      { data: customerData },
      { data: providerData },
      { data: serviceData },
    ] = await Promise.all([
      this.identityDb
        .from('users')
        .select('full_name,contact_number')
        .eq('id', customerId)
        .maybeSingle(),
      this.identityDb
        .from('users')
        .select('full_name,contact_number')
        .eq('id', providerId)
        .maybeSingle(),
      this.catalogDb
        .from('provider_services')
        .select('title')
        .eq('id', serviceId)
        .maybeSingle(),
    ]);

    const customer = customerData as Pick<
      User,
      'full_name' | 'contact_number'
    > | null;
    const provider = providerData as Pick<
      User,
      'full_name' | 'contact_number'
    > | null;
    const service = serviceData as Pick<ProviderService, 'title'> | null;

    return {
      customerName: customer?.full_name || 'Customer',
      customerPhone: customer?.contact_number || '',
      providerName: provider?.full_name || 'Service Provider',
      providerPhone: provider?.contact_number || '',
      serviceName: service?.title || 'Service Booking',
    };
  }

  @OnEvent(BOOKING_EVENTS.CREATED)
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.logger.log(
      `Handling booking identification for: ${event.bookingReference}`,
    );

    try {
      // 1. Create Conversation
      await withRetry(async () => {
        const { error } = await this.bookingDb.from('conversations').insert([
          {
            booking_id: event.bookingId,
            customer_id: event.customerId,
            provider_id: event.dto.provider_id,
            service_id: event.dto.service_id,
            last_message_text: 'Booking created. Start a conversation.',
            last_message_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
      });

      // 2. Create Payment Record (Cross-schema)
      await withRetry(async () => {
        const { error } = await this.paymentDb.from('payments').insert([
          {
            booking_id: event.bookingId,
            customer_id: event.customerId,
            provider_id: event.dto.provider_id,
            amount: event.totalAmount,
            method: 'cash',
            status: 'pending',
            transaction_reference: `PAY-${Date.now()}`,
          },
        ]);
        if (error) throw error;
      });

      // 3. Dispatch Notification to Provider
      await withRetry(async () => {
        const d = await this.getLookupData(
          event.customerId,
          event.dto.provider_id,
          event.dto.service_id,
        );
        const { error: notificationError } = await this.notificationDb
          .from('notifications')
          .insert([
            {
              user_id: event.dto.provider_id,
              actor_id: event.customerId,
              booking_id: event.bookingId,
              type: 'booking_requested',
              title: `New booking request from ${d.customerName}`,
              body: `${d.serviceName} needs your confirmation.`,
              is_read: false,
              data: {
                bookingId: event.bookingId,
                senderName: d.customerName,
                serviceName: d.serviceName,
                senderPhone: d.customerPhone,
                recipientRole: 'provider',
                target: {
                  screen: '/provider-booking-details',
                  params: { id: event.bookingId },
                },
                fallbackTarget: {
                  screen: '/provider-chat',
                  params: {
                    id: event.bookingId,
                    name: d.customerName,
                    phone: d.customerPhone,
                    serviceName: d.serviceName,
                    initials: d.customerName.slice(0, 2).toUpperCase(),
                  },
                },
                context: {
                  bookingStatus: 'pending',
                  recipientRole: 'provider',
                  senderName: d.customerName,
                  serviceName: d.serviceName,
                },
              },
            },
          ]);
        if (notificationError) throw notificationError;
      });

      this.logger.log(
        `Post-booking actions completed for ${event.bookingReference}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to complete post-booking actions for ${event.bookingReference}: ${error.message}`,
      );
    }
  }

  @OnEvent(BOOKING_EVENTS.CANCELLED)
  async handleBookingCancelled(event: BookingCancelledEvent) {
    this.logger.log(
      `Handling booking cancellation notifications for: ${event.bookingReference}`,
    );
    try {
      await withRetry(async () => {
        // Here actor is Customer, so Provider gets notified that Customer canceled
        const d = await this.getLookupData(
          event.customerId,
          event.providerId,
          event.serviceId,
        );
        const { error: cancelError } = await this.notificationDb
          .from('notifications')
          .insert([
            {
              user_id: event.providerId,
              actor_id: event.customerId,
              booking_id: event.bookingId,
              type: 'booking_cancelled',
              title: `${d.customerName} cancelled the booking`,
              body: `${d.serviceName} no longer requires provider action.`,
              is_read: false,
              data: {
                bookingId: event.bookingId,
                senderName: d.customerName,
                serviceName: d.serviceName,
                senderPhone: d.customerPhone,
                recipientRole: 'provider',
                target: {
                  screen: '/provider-booking-details',
                  params: { id: event.bookingId },
                },
                fallbackTarget: {
                  screen: '/provider-chat',
                  params: {
                    id: event.bookingId,
                    name: d.customerName,
                    phone: d.customerPhone,
                    serviceName: d.serviceName,
                    initials: d.customerName.slice(0, 2).toUpperCase(),
                  },
                },
                context: {
                  bookingStatus: 'cancelled',
                  recipientRole: 'provider',
                  senderName: d.customerName,
                  serviceName: d.serviceName,
                },
              },
            },
          ]);
        if (cancelError) throw cancelError;
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit cancellation notification: ${error.message}`,
      );
    }
  }

  @OnEvent(BOOKING_EVENTS.STATUS_UPDATED)
  async handleBookingStatusUpdated(event: BookingStatusUpdatedEvent) {
    this.logger.log(
      `Handling booking status updated for: ${event.bookingReference} to ${event.targetStatus}`,
    );
    try {
      await withRetry(async () => {
        // Here actor is Provider, Provider updates status, Customer gets notified
        const d = await this.getLookupData(
          event.customerId,
          event.providerId,
          event.serviceId,
        );

        const notificationMap: Record<
          string,
          { type: string; title: string; body: string; targetScreen: string }
        > = {
          confirmed: {
            type: 'booking_confirmed',
            title: `${d.providerName} confirmed your booking`,
            body: `${d.serviceName} is confirmed and ready for tracking.`,
            targetScreen: '/customer-booking-details',
          },
          in_progress: {
            type: 'booking_in_progress',
            title: `${d.providerName} started your service`,
            body: `${d.serviceName} is now in progress.`,
            targetScreen: '/customer-track-order',
          },
          completed: {
            type: 'booking_completed',
            title: `${d.serviceName} is complete`,
            body: `Your provider marked this service as completed.`,
            targetScreen: '/customer-booking-details',
          },
          cancelled: {
            type: 'booking_cancelled',
            title: `${d.serviceName} was cancelled`,
            body: `This booking was cancelled by the provider.`,
            targetScreen: '/customer-booking-details',
          },
        };

        const notification = notificationMap[event.targetStatus];
        if (!notification) {
          this.logger.warn(
            `No notification mapped for status: ${event.targetStatus}`,
          );
          return;
        }

        const { error: statusUpdateError } = await this.notificationDb
          .from('notifications')
          .insert([
            {
              user_id: event.customerId,
              actor_id: event.providerId,
              booking_id: event.bookingId,
              type: notification.type,
              title: notification.title,
              body: notification.body,
              is_read: false,
              data: {
                bookingId: event.bookingId,
                senderName: d.providerName,
                serviceName: d.serviceName,
                senderPhone: d.providerPhone,
                recipientRole: 'customer',
                target: {
                  screen: notification.targetScreen,
                  params: { id: event.bookingId },
                },
                fallbackTarget: {
                  screen: '/customer-chat',
                  params: {
                    id: event.bookingId,
                    providerName: d.providerName,
                    phone: d.providerPhone,
                    serviceName: d.serviceName,
                  },
                },
                context: {
                  bookingStatus: event.targetStatus,
                  recipientRole: 'customer',
                  senderName: d.providerName,
                  serviceName: d.serviceName,
                },
              },
            },
          ]);
        if (statusUpdateError) throw statusUpdateError;
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit status update notification: ${error.message}`,
      );
    }
  }
}
