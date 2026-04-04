import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  PAYMENT_CLIENT,
  BOOKING_CLIENT,
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
} from '../../database/supabase.module';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentDb: jest.Mocked<SupabaseClient>;

  beforeEach(async () => {
    const mockDb = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PAYMENT_CLIENT, useValue: mockDb },
        { provide: BOOKING_CLIENT, useValue: mockDb },
        { provide: IDENTITY_CLIENT, useValue: mockDb },
        { provide: CATALOG_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentDb = module.get(PAYMENT_CLIENT);
  });

  describe('createPayment', () => {
    it('should insert a new payment record', async () => {
      const dto = {
        booking_id: 'bkg-123',
        customer_id: 'cust-1',
        provider_id: 'prov-1',
        amount: 1000,
        method: 'cash' as const,
      };

      (paymentDb.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'pay-1', amount: 1000, status: 'pending' },
          error: null,
        }),
      });

      const result = await service.createPayment(dto as any);
      expect(result.status).toBe('success');
      expect(result.data.amount).toBe(1000);
    });
  });

  describe('getProviderEarningsSummary', () => {
    it('should calculate net earnings correctly with 10% platform fee', async () => {
      const providerId = 'prov-1';
      const mockPayments = [
        {
          id: 'p1',
          amount: 1000,
          status: 'completed',
          method: 'cash',
          booking_id: 'b1',
        },
      ];

      // Mock getProviderPaymentHistory call within service
      jest.spyOn(service, 'getProviderPaymentHistory').mockResolvedValueOnce({
        payments: [
          {
            ...mockPayments[0],
            net_earnings: 900,
            platform_fee: 100,
          },
        ],
      } as any);

      const result = await service.getProviderEarningsSummary(providerId);

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalNetEarnings).toBe(900);
      expect(result.cashOnHand).toBe(1000);
    });
  });

  describe('markBookingPaymentPaid', () => {
    it('should update status to completed and set paid_at', async () => {
      const bookingId = 'bkg-123';

      (paymentDb.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'pay-1', method: 'cash' },
          error: null,
        }),
      });

      (paymentDb.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'pay-1', status: 'completed' },
          error: null,
        }),
      });

      const result = await service.markBookingPaymentPaid({ bookingId });
      expect(result.payment!.status).toBe('completed');
    });
  });
});
