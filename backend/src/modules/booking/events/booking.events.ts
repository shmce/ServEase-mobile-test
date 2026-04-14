import { CreateBookingDto } from '../dto/create-booking.dto';

export class BookingCreatedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly bookingReference: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly dto: CreateBookingDto,
  ) {}
}

export class BookingCancelledEvent {
  constructor(
    public readonly bookingId: string,
    public readonly bookingReference: string,
    public readonly customerId: string,
    public readonly providerId: string,
    public readonly serviceId: string,
  ) {}
}

export class BookingStatusUpdatedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly bookingReference: string,
    public readonly customerId: string,
    public readonly providerId: string,
    public readonly serviceId: string,
    public readonly targetStatus: string,
  ) {}
}

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CANCELLED: 'booking.cancelled',
  COMPLETED: 'booking.completed',
  STATUS_UPDATED: 'booking.status_updated',
};
