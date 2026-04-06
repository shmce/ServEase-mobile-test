/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-then */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { NOTIFICATION_CLIENT } from '../../database/supabase.module';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationDb: jest.Mocked<SupabaseClient>;

  const createMockBuilder = (result: any) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (onfulfilled: any) => Promise.resolve(onfulfilled(result)),
    } as any;
    return builder;
  };

  beforeEach(async () => {
    const mockDb = {
      from: jest.fn(() => createMockBuilder({ data: [], error: null })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NOTIFICATION_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationDb = module.get(NOTIFICATION_CLIENT);
  });

  describe('getNotifications', () => {
    it('should return an empty list if data is empty', async () => {
      const builder = createMockBuilder({ data: [], error: null });
      (notificationDb.from as jest.Mock).mockReturnValue(builder);

      const result = await service.getNotifications('user-123');
      expect(result.notifications).toEqual([]);
    });

    it('should return notifications list successfully', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', is_read: false },
        { id: '2', title: 'Test 2', is_read: true },
      ];
      const builder = createMockBuilder({
        data: mockNotifications,
        error: null,
      });
      (notificationDb.from as jest.Mock).mockReturnValue(builder);

      const result = await service.getNotifications('user-123');
      expect(result.notifications.length).toBe(2);
      expect(result.notifications[0].title).toBe('Test 1');
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      const builder = createMockBuilder({ error: null });
      (notificationDb.from as jest.Mock).mockReturnValue(builder);

      const result = await service.markRead('user-123', 'notif-1');
      expect(result.success).toBe(true);
      expect(notificationDb.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count correctly', async () => {
      const builder = createMockBuilder({ count: 5, error: null });
      (notificationDb.from as jest.Mock).mockReturnValue(builder);

      const result = await service.getUnreadCount('user-123');
      expect(result.count).toBe(5);
    });
  });
});
