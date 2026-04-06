import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { NOTIFICATION_CLIENT } from '../../database/supabase.module';
import { getResult, getMaybeSingle } from '../../common/utils/database.utils';
import { Notification } from '../../common/interfaces/database.interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationDb: SupabaseClient,
  ) {}

  async getNotifications(userId: string) {
    const notifications = await getResult<Notification[]>(
      this.notificationDb
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'GetNotifications',
      { allowEmpty: true },
    );

    return { notifications };
  }

  async markRead(userId: string, notificationId: string) {
    await this.notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.notificationDb
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return { count: 0 };
    return { count: count ?? 0 };
  }
}
