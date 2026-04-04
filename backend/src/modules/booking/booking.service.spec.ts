import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_CLIENT,
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
  PAYMENT_CLIENT,
  NOTIFICATION_CLIENT,
} from '../../database/supabase.module';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BOOKING_EVENTS } from './events/booking.events';

describe('BookingService', () => {
  let service: BookingService;
  let bookingDb: jest.Mocked<SupabaseClient>;
  let identityDb: jest.Mocked<SupabaseClient>;
  let catalogDb: jest.Mocked<SupabaseClient>;
  let paymentDb: jest.Mocked<SupabaseClient>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockDb = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        select_single: jest.fn().mockReturnThis(),
      })),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: BOOKING_CLIENT, useValue: mockDb },
        { provide: IDENTITY_CLIENT, useValue: mockDb },
        { provide: CATALOG_CLIENT, useValue: mockDb },
        { provide: PAYMENT_CLIENT, useValue: mockDb },
        { provide: NOTIFICATION_CLIENT, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingDb = module.get(BOOKING_CLIENT);
    identityDb = module.get(IDENTITY_CLIENT);
    catalogDb = module.get(CATALOG_CLIENT);
    paymentDb = module.get(PAYMENT_CLIENT);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('createBooking', () => {
    const mockDto = {
      provider_id: 'provider-123',
      service_id: 'service-456',
      service_address: '123 Main St',
      scheduled_at: new Date().toISOString(),
      pricing_mode: 'flat' as const,
    };

    it('should create a booking successfully and emit event', async () => {
      // Mock identity check
      (identityDb.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'provider', status: 'active' },
          error: null,
        }),
      });

      // Mock catalog profile check
      (catalogDb.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { verification_status: 'approved' },
          error: null,
        }),
      });

      // Mock service check
      (catalogDb.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'service-456',
            provider_id: 'provider-123',
            supports_flat: true,
            flat_rate: 500,
          },
          error: null,
        }),
      });

      // Mock booking insert
      (bookingDb.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'bkg-1',
            booking_reference: 'BKG-123',
            status: 'pending',
            total_amount: 500,
          },
          error: null,
        }),
      });

      const result = await service.createBooking(
        mockDto as any,
        'customer-789',
      );

      expect(result.message).toBe('Booking created successfully.');
      expect(result.booking.total_amount).toBe(500);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        BOOKING_EVENTS.CREATED,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if provider is not verified', async () => {
      (identityDb.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'provider', status: 'pending' },
          error: null,
        }),
      });

      await expect(
        service.createBooking(mockDto as any, 'customer-789'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelBooking', () => {
    it('should update booking and payment status to cancelled', async () => {
      const bookingId = 'bkg-1';
      const customerId = 'customer-789';

      (bookingDb.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: bookingId, status: 'cancelled' },
          error: null,
        }),
      });

      const result = await service.cancelBooking(
        bookingId,
        customerId,
        'Change of plans',
        'No longer need it',
      );

      expect(result.booking.status).toBe('cancelled');
      expect(paymentDb.from).toHaveBeenCalledWith('payments');
    });
  });
});
