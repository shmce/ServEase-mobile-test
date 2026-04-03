import { CreateBookingDto } from '../dto/create-booking.dto';

export class BookingCreatedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly bookingReference: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly dto: CreateBookingDto
  ) {}
}

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CANCELLED: 'booking.cancelled',
  COMPLETED: 'booking.completed',
};
