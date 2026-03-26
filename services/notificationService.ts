import { supabase, notificationDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';
import {
  areMessageNotificationsEnabled,
  type NotificationRole,
} from '../lib/notification-preferences';

type NotificationSubscription = () => void;
export type AppNotificationType =
  | 'chat_message'
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_in_progress'
  | 'booking_completed'
  | 'booking_cancelled';
export type NotificationTarget = {
  screen: string;
  params: Record<string, string>;
};
export type NotificationContext = {
  bookingStatus: string;
  recipientRole: NotificationRole;
  senderName: string;
  serviceName: string;
};
export type AppNotificationData = {
  bookingId: string;
  senderName: string;
  serviceName: string;
  senderPhone: string;
  recipientRole: NotificationRole;
  target?: NotificationTarget;
  fallbackTarget?: NotificationTarget;
  context?: NotificationContext;
};

export type AppNotification = {
  id: string;
  userId: string;
  actorId: string;
  bookingId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  timeLabel: string;
  data: AppNotificationData;
};

const memoryNotifications = new Map<string, AppNotification[]>();

const createChannelName = (scope: string, value: string) =>
  `notifications:${scope}:${value}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

const formatTimeLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Now';

  return parsed.toLocaleDateString() === new Date().toLocaleDateString()
    ? parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getMemoryNotifications = (userId: string) => memoryNotifications.get(userId) || [];

const setMemoryNotifications = (userId: string, notifications: AppNotification[]) => {
  memoryNotifications.set(userId, notifications);
};

const mapNotificationRow = (row: any): AppNotification => {
  const createdAt = String(row?.created_at || new Date().toISOString());
  const rawData = typeof row?.data === 'object' && row?.data ? row.data : {};
  const rawType = String(row?.type || 'chat_message');
  const type: AppNotificationType =
    rawType === 'booking_requested' ||
    rawType === 'booking_confirmed' ||
    rawType === 'booking_in_progress' ||
    rawType === 'booking_completed' ||
    rawType === 'booking_cancelled'
      ? rawType
      : 'chat_message';
  return {
    id: String(row?.id || `notification-${createdAt}`),
    userId: String(row?.user_id || ''),
    actorId: String(row?.actor_id || ''),
    bookingId: String(row?.booking_id || ''),
    type,
    title: String(row?.title || 'Notification'),
    body: String(row?.body || ''),
    isRead: Boolean(row?.is_read),
    createdAt,
    timeLabel: formatTimeLabel(createdAt),
    data: {
      bookingId: String(rawData.bookingId || row?.booking_id || ''),
      senderName: String(rawData.senderName || ''),
      serviceName: String(rawData.serviceName || ''),
      senderPhone: String(rawData.senderPhone || ''),
      recipientRole: String(rawData.recipientRole || 'customer') === 'provider' ? 'provider' : 'customer',
      target: rawData.target,
      fallbackTarget: rawData.fallbackTarget,
      context: rawData.context,
    },
  };
};

export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  if (!userId) return [];

  try {
    const { data, error } = await notificationDb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(mapNotificationRow);
    }
  } catch {
    // Fall back to local notifications.
  }

  return getMemoryNotifications(userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  if (!userId || !notificationId) return;

  setMemoryNotifications(
    userId,
    getMemoryNotifications(userId).map((notification) =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    )
  );

  try {
    await notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  } catch {
    // Keep local read state even if remote update fails.
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  if (!userId) return;

  setMemoryNotifications(
    userId,
    getMemoryNotifications(userId).map((notification) => ({ ...notification, isRead: true }))
  );

  try {
    await notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch {
    // Keep local read state even if remote update fails.
  }
};

export const getUnreadNotificationCount = async (userId: string) => {
  const notifications = await getNotifications(userId);
  return notifications.filter((notification) => !notification.isRead).length;
};

export const createChatNotification = async (input: {
  recipientUserId: string;
  recipientRole: NotificationRole;
  actorId: string;
  bookingId: string;
  senderName: string;
  serviceName: string;
  senderPhone?: string;
  target?: NotificationTarget;
  fallbackTarget?: NotificationTarget;
  context?: NotificationContext;
}) => {
  const recipientUserId = String(input.recipientUserId || '').trim();
  if (!recipientUserId) return null;

  const notificationsEnabled = await areMessageNotificationsEnabled(
    recipientUserId,
    input.recipientRole
  );
  if (!notificationsEnabled) return null;

  const createdAt = new Date().toISOString();
  const data: AppNotificationData = {
    bookingId: input.bookingId,
    senderName: input.senderName,
    serviceName: input.serviceName,
    senderPhone: input.senderPhone || '',
    recipientRole: input.recipientRole,
    target: input.target,
    fallbackTarget: input.fallbackTarget,
    context: input.context,
  };
  const nextNotification: AppNotification = {
    id: `local-notification-${createdAt}`,
    userId: recipientUserId,
    actorId: input.actorId,
    bookingId: input.bookingId,
    type: 'chat_message',
    title: `New message from ${input.senderName}`,
    body: `${input.serviceName}: open chat to reply.`,
    isRead: false,
    createdAt,
    timeLabel: formatTimeLabel(createdAt),
    data,
  };

  setMemoryNotifications(recipientUserId, [
    nextNotification,
    ...getMemoryNotifications(recipientUserId),
  ]);

  try {
    const { data, error } = await notificationDb
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        actor_id: input.actorId,
        booking_id: input.bookingId,
        type: 'chat_message',
        title: nextNotification.title,
        body: nextNotification.body,
        is_read: false,
        data,
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      const saved = mapNotificationRow(data);
      setMemoryNotifications(
        recipientUserId,
        getMemoryNotifications(recipientUserId).map((notification) =>
          notification.id === nextNotification.id ? saved : notification
        )
      );
      return saved;
    }
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to persist notification. Keeping local copy.'));
  }

  return nextNotification;
};

export const createBookingStatusNotification = async (input: {
  recipientUserId: string;
  recipientRole: NotificationRole;
  actorId: string;
  bookingId: string;
  type:
    | 'booking_requested'
    | 'booking_confirmed'
    | 'booking_in_progress'
    | 'booking_completed'
    | 'booking_cancelled';
  title: string;
  body: string;
  senderName: string;
  serviceName: string;
  senderPhone?: string;
  bookingStatus: string;
  target?: NotificationTarget;
  fallbackTarget?: NotificationTarget;
}) => {
  const recipientUserId = String(input.recipientUserId || '').trim();
  if (!recipientUserId) return null;

  const createdAt = new Date().toISOString();
  const data: AppNotificationData = {
    bookingId: input.bookingId,
    senderName: input.senderName,
    serviceName: input.serviceName,
    senderPhone: input.senderPhone || '',
    recipientRole: input.recipientRole,
    target: input.target,
    fallbackTarget: input.fallbackTarget,
    context: {
      bookingStatus: input.bookingStatus,
      recipientRole: input.recipientRole,
      senderName: input.senderName,
      serviceName: input.serviceName,
    },
  };

  const nextNotification: AppNotification = {
    id: `local-notification-${createdAt}`,
    userId: recipientUserId,
    actorId: input.actorId,
    bookingId: input.bookingId,
    type: input.type,
    title: input.title,
    body: input.body,
    isRead: false,
    createdAt,
    timeLabel: formatTimeLabel(createdAt),
    data,
  };

  setMemoryNotifications(recipientUserId, [
    nextNotification,
    ...getMemoryNotifications(recipientUserId),
  ]);

  try {
    const { data: savedRow, error } = await notificationDb
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        actor_id: input.actorId,
        booking_id: input.bookingId,
        type: input.type,
        title: input.title,
        body: input.body,
        is_read: false,
        data,
      })
      .select('*')
      .maybeSingle();

    if (!error && savedRow) {
      const saved = mapNotificationRow(savedRow);
      setMemoryNotifications(
        recipientUserId,
        getMemoryNotifications(recipientUserId).map((notification) =>
          notification.id === nextNotification.id ? saved : notification
        )
      );
      return saved;
    }
  } catch (error) {
    console.warn(getErrorMessage(error, 'Failed to persist booking notification. Keeping local copy.'));
  }

  return nextNotification;
};

export const subscribeToNotifications = (input: {
  userId: string;
  onChange: () => void;
}): NotificationSubscription => {
  const userId = String(input.userId || '').trim();
  if (!userId) return () => {};

  const channel = supabase
    .channel(createChannelName('user', userId))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'notification_svc',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => input.onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
