/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-then */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_CLIENT,
  CATALOG_CLIENT,
  IDENTITY_CLIENT,
  NOTIFICATION_CLIENT,
} from '../../database/supabase.module';
import { ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let bookingDb: jest.Mocked<SupabaseClient>;
  let catalogDb: jest.Mocked<SupabaseClient>;
  let identityDb: jest.Mocked<SupabaseClient>;
  let notificationDb: jest.Mocked<SupabaseClient>;

  const createMockBuilder = (data: any, error: any = null) => {
    const builder = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      then: (onfulfilled: any) => Promise.resolve(onfulfilled({ data, error })),
    } as any;
    return builder;
  };

  beforeEach(async () => {
    const mockDb = {
      from: jest.fn(() => createMockBuilder({ data: [], error: null })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: BOOKING_CLIENT, useValue: mockDb },
        { provide: CATALOG_CLIENT, useValue: mockDb },
        { provide: IDENTITY_CLIENT, useValue: mockDb },
        { provide: NOTIFICATION_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    bookingDb = module.get(BOOKING_CLIENT);
    catalogDb = module.get(CATALOG_CLIENT);
    identityDb = module.get(IDENTITY_CLIENT);
    notificationDb = module.get(NOTIFICATION_CLIENT);
  });

  describe('sendMessage', () => {
    const bookingId = 'bkg-123';
    const senderId = 'user-456';
    const text = 'Hello world';

    it('should send a message successfully', async () => {
      // Mock assertParticipant check
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder({
          id: bookingId,
          customer_id: senderId,
          provider_id: 'prov-789',
      }));

      // Mock conversation upsert
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder({ id: 'conv-1' }));

      // Mock message insert
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder({ id: 'msg-1', text }));

      // Mock notification insert
      (notificationDb.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await service.sendMessage(bookingId, senderId, text);
      expect(result.id).toBe('msg-1');
      expect(bookingDb.from).toHaveBeenCalledWith('messages');
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder({
          id: bookingId,
          customer_id: 'other-user',
          provider_id: 'prov-789',
      }));

      await expect(
        service.sendMessage(bookingId, senderId, text),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getConversations', () => {
    it('should return empty list if no conversations found', async () => {
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder([]));

      const result = await service.getConversations('user-456', 'customer');
      expect(result).toEqual([]);
    });

    it('should return conversations successfully', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          booking_id: 'b-1',
          customer_id: 'user-456',
          provider_id: 'p-1',
        },
      ];
      (bookingDb.from as jest.Mock).mockReturnValueOnce(
        createMockBuilder(mockConversations),
      );

      // Mock identity and bookings lookups
      (identityDb.from as jest.Mock).mockReturnValueOnce(
        createMockBuilder([{ id: 'p-1', full_name: 'Provider One' }]),
      );
      (bookingDb.from as jest.Mock).mockReturnValueOnce(
        createMockBuilder([{ id: 'b-1', service_id: 'svc-1' }]),
      );
      (catalogDb.from as jest.Mock).mockReturnValueOnce(
        createMockBuilder([{ id: 'svc-1', title: 'Test Service' }]),
      );
      (bookingDb.from as jest.Mock).mockReturnValueOnce(createMockBuilder([])); // messages

      const result = await service.getConversations('user-456', 'customer');
      expect(result.length).toBe(1);
      expect(result[0].otherPartyName).toBe('Provider One');
      expect(result[0].serviceName).toBe('Test Service');
    });
  });
});
