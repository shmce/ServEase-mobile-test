import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';
import { getCustomerBookingPresentation } from '../lib/booking-status';
import { getCustomerBookings } from './bookingService';
import { getProviderBookingActionState, getProviderBookings } from './providerBookingService';
import { getInitials } from '../lib/communication';
import { createChatNotification } from './notificationService';

type ChatRole = 'customer' | 'provider';
type ChatSubscription = () => void;
export type ChatDeliveryStatus = 'sent' | 'delivered' | 'failed';
type ReadState = {
  customerLastReadAt?: string;
  providerLastReadAt?: string;
};

export type ChatSummary = {
  id: string;
  bookingId: string;
  otherPartyName: string;
  otherPartyPhone: string;
  serviceName: string;
  avatar: string;
  initials: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
};

export type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  timeLabel: string;
  sender: ChatRole;
  deliveryStatus: ChatDeliveryStatus;
};

export type ChatThread = {
  id: string;
  bookingId: string;
  otherPartyName: string;
  otherPartyPhone: string;
  serviceName: string;
  avatar: string;
  initials: string;
  online: boolean;
  messages: ChatMessage[];
};

const memoryMessages = new Map<string, ChatMessage[]>();
const memoryReadState = new Map<string, ReadState>();

const buildAvatar = (seed: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
const buildConversationId = (bookingId: string) => `booking:${bookingId}`;
const createChannelName = (scope: string, value: string) =>
  `chat:${scope}:${value}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

const scheduleRealtimeRefresh = (callback: () => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return {
    trigger() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        callback();
      }, 150);
    },
    clear() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    },
  };
};

const formatTimeLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Now';
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatSummaryTime = (value?: string) => {
  if (!value) return 'Now';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Now';
  return parsed.toLocaleDateString() === new Date().toLocaleDateString()
    ? parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const buildNotificationTargets = (input: {
  bookingId: string;
  recipientRole: ChatRole;
  bookingStatus?: string | null;
  senderName: string;
  senderPhone: string;
  serviceName: string;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  const serviceName = String(input.serviceName || 'Service Booking');

  if (input.recipientRole === 'provider') {
    const bookingState = getProviderBookingActionState(input.bookingStatus);
    const target = bookingState.canResumeService
      ? {
          screen: '/provider-service-in-progress',
          params: { id: bookingId },
        }
      : bookingState.canStartService
        ? {
            screen: '/provider-start-service',
            params: { id: bookingId },
          }
        : {
            screen: '/provider-booking-details',
            params: { id: bookingId },
          };

    return {
      target,
      fallbackTarget: {
        screen: '/provider-chat',
        params: {
          id: bookingId,
          name: input.senderName || 'Customer',
          phone: input.senderPhone || '',
          serviceName,
          initials: String(input.senderName || 'CU')
            .split(/\s+/)
            .map((part) => part[0] || '')
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        },
      },
      context: {
        bookingStatus: String(input.bookingStatus || ''),
        recipientRole: 'provider' as const,
        senderName: input.senderName,
        serviceName,
      },
    };
  }

  const bookingState = getCustomerBookingPresentation(input.bookingStatus);
  return {
    target: bookingState.canTrack
      ? {
          screen: '/customer-track-order',
          params: { id: bookingId },
        }
      : {
          screen: '/customer-booking-details',
          params: { id: bookingId },
        },
    fallbackTarget: {
      screen: '/customer-chat',
      params: {
        id: bookingId,
        providerName: input.senderName || 'Service Provider',
        phone: input.senderPhone || '',
        serviceName,
      },
    },
    context: {
      bookingStatus: String(input.bookingStatus || ''),
      recipientRole: 'customer' as const,
      senderName: input.senderName,
      serviceName,
    },
  };
};

const normalizeDeliveryStatus = (value: unknown): ChatDeliveryStatus => {
  const status = String(value || '').toLowerCase();
  if (status === 'sent' || status === 'failed') return status;
  return 'delivered';
};

const getReadState = (bookingId: string): ReadState => memoryReadState.get(bookingId) || {};

const setReadState = (bookingId: string, role: ChatRole, timestamp: string) => {
  const current = getReadState(bookingId);
  memoryReadState.set(bookingId, {
    ...current,
    ...(role === 'customer'
      ? { customerLastReadAt: timestamp }
      : { providerLastReadAt: timestamp }),
  });
};

const countUnreadMessages = (messages: ChatMessage[], role: ChatRole, lastReadAt?: string | null) => {
  const readAt = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter((message) => {
    if (message.sender === role) return false;
    const createdAt = new Date(message.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt > readAt;
  }).length;
};

const mapStoredMessages = (rows: any[]): ChatMessage[] =>
  rows.map((row, index) => {
    const createdAt = String(row?.created_at || new Date().toISOString());
    const senderRole =
      String(row?.sender_role || row?.sender || '').toLowerCase().includes('provider')
        ? 'provider'
        : 'customer';

    return {
      id: String(row?.id || `${createdAt}-${index}`),
      text: String(row?.body || row?.content || row?.message || ''),
      createdAt,
      timeLabel: formatTimeLabel(createdAt),
      sender: senderRole,
      deliveryStatus: normalizeDeliveryStatus(row?.delivery_status),
    };
  });

const mapConversationMessages = (rows: any[]): ChatMessage[] =>
  rows.map((row, index) => {
    const createdAt = String(row?.created_at || new Date().toISOString());
    const senderRole =
      String(row?.sender_role || '').toLowerCase() === 'provider'
        ? 'provider'
        : 'customer';

    return {
      id: String(row?.id || `${createdAt}-${index}`),
      text: String(row?.body || ''),
      createdAt,
      timeLabel: formatTimeLabel(createdAt),
      sender: senderRole,
      deliveryStatus: normalizeDeliveryStatus(row?.delivery_status),
    };
  });

const tryLoadConversationRecords = async (role: ChatRole, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq(role === 'customer' ? 'customer_id' : 'provider_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) return null;
    return data || [];
  } catch {
    return null;
  }
};

const tryLoadConversationMessages = async (bookingId: string) => {
  try {
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (conversationError || !conversation?.id) return null;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error || !data) return null;
    return mapConversationMessages(data);
  } catch {
    return null;
  }
};

const tryLoadSupabaseMessages = async (bookingId: string) => {
  const attempts = [
    () =>
      supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true }),
    () =>
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', bookingId)
        .order('created_at', { ascending: true }),
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();
      if (!error && data) return mapStoredMessages(data);
    } catch {
      // Ignore and continue to fallback strategy.
    }
  }

  return null;
};

const tryUpsertConversation = async (input: {
  bookingId: string;
  customerId?: string;
  providerId?: string;
  serviceId?: string;
  text?: string;
  createdAt?: string;
  customerLastReadAt?: string;
  providerLastReadAt?: string;
}) => {
  if (!input.customerId || !input.providerId) return null;

  try {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        booking_id: input.bookingId,
        customer_id: input.customerId,
        provider_id: input.providerId,
        service_id: input.serviceId || null,
        last_message_text: input.text || null,
        last_message_at: input.createdAt || null,
        customer_last_read_at: input.customerLastReadAt || null,
        provider_last_read_at: input.providerLastReadAt || null,
      }, { onConflict: 'booking_id' })
      .select('id')
      .maybeSingle();

    if (error) return null;
    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
};

const tryPersistSupabaseMessage = async (
  bookingId: string,
  senderId: string,
  senderRole: ChatRole,
  text: string,
  conversationId?: string | null
) => {
  const payloads = [
    ...(conversationId
      ? [
          {
            conversation_id: conversationId,
            booking_id: bookingId,
            sender_id: senderId,
            sender_role: senderRole,
            body: text,
            delivery_status: 'delivered',
          },
        ]
      : []),
    { booking_id: bookingId, sender_id: senderId, sender_role: senderRole, body: text, delivery_status: 'delivered' },
    { conversation_id: bookingId, sender_id: senderId, sender_role: senderRole, body: text, delivery_status: 'delivered' },
    { booking_id: bookingId, sender_id: senderId, sender_role: senderRole, content: text },
    { conversation_id: bookingId, sender_id: senderId, sender_role: senderRole, content: text },
  ];

  for (const payload of payloads) {
    try {
      const { error } = await supabase.from('messages').insert(payload);
      if (!error) return true;
    } catch {
      // Ignore and continue.
    }
  }

  return false;
};

const getMemoryMessages = (bookingId: string) => memoryMessages.get(bookingId) || [];
const setMemoryMessages = (bookingId: string, messages: ChatMessage[]) => {
  memoryMessages.set(bookingId, messages);
};
const replaceMemoryMessage = (bookingId: string, messageId: string, nextMessage: ChatMessage) => {
  setMemoryMessages(
    bookingId,
    getMemoryMessages(bookingId).map((message) =>
      message.id === messageId ? nextMessage : message
    )
  );
};

const getLatestMessage = (messages: ChatMessage[]) =>
  [...messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  ).slice(-1)[0] || null;

const buildSummaryFromBooking = async (
  bookingId: string,
  role: ChatRole,
  otherPartyName: string,
  otherPartyPhone: string,
  serviceName: string
): Promise<ChatSummary | null> => {
  const supabaseMessages =
    (await tryLoadConversationMessages(bookingId)) || (await tryLoadSupabaseMessages(bookingId));
  const messages = (supabaseMessages && supabaseMessages.length
    ? supabaseMessages
    : getMemoryMessages(bookingId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!messages.length) return null;

  const lastMessage = getLatestMessage(messages);
  const readState = getReadState(bookingId);

  return {
    id: buildConversationId(bookingId),
    bookingId,
    otherPartyName,
    otherPartyPhone,
    serviceName,
    avatar: buildAvatar(`${bookingId}-${otherPartyName}`),
    initials: getInitials(otherPartyName),
    lastMessage: lastMessage?.text || 'Open chat to continue the conversation.',
    lastMessageTime: formatSummaryTime(lastMessage?.createdAt),
    unreadCount: countUnreadMessages(
      messages,
      role,
      role === 'customer' ? readState.customerLastReadAt : readState.providerLastReadAt
    ),
    online: true,
  };
};

const enrichConversationSummaries = async (
  rows: any[],
  role: ChatRole
): Promise<ChatSummary[]> => {
  if (!rows.length) return [];

  const serviceIds = Array.from(new Set(rows.map((row) => row.service_id).filter(Boolean)));
  const otherPartyIds = Array.from(
    new Set(
      rows.map((row) => (role === 'customer' ? row.provider_id : row.customer_id)).filter(Boolean)
    )
  );

  const [{ data: users }, { data: services }] = await Promise.all([
    otherPartyIds.length
      ? supabase.from('users').select('id,full_name,contact_number').in('id', otherPartyIds)
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? supabase.from('provider_services').select('id,title').in('id', serviceIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const userMap = new Map((users || []).map((item: any) => [item.id, item]));
  const serviceMap = new Map((services || []).map((item: any) => [item.id, item]));

  const unreadCounts = await Promise.all(
    rows.map(async (row) => {
      const bookingId = String(row.booking_id);
      const messages = await tryLoadConversationMessages(bookingId);
      const lastReadAt =
        role === 'customer' ? row.customer_last_read_at : row.provider_last_read_at;

      if (messages?.length) {
        return countUnreadMessages(messages, role, lastReadAt);
      }

      const readState = getReadState(bookingId);
      const fallbackLastReadAt =
        role === 'customer' ? readState.customerLastReadAt : readState.providerLastReadAt;
      return countUnreadMessages(getMemoryMessages(bookingId), role, fallbackLastReadAt);
    })
  );

  return rows.map((row, index) => {
    const bookingId = String(row.booking_id);
    const otherPartyId = role === 'customer' ? row.provider_id : row.customer_id;
    const otherParty = userMap.get(otherPartyId) || {};
    const service = serviceMap.get(row.service_id) || {};

    return {
      id: String(row.id || buildConversationId(bookingId)),
      bookingId,
      otherPartyName: String(otherParty.full_name || 'Service Contact'),
      otherPartyPhone: String(otherParty.contact_number || ''),
      serviceName: String(service.title || 'Service Booking'),
      avatar: buildAvatar(`${bookingId}-${otherPartyId || 'contact'}`),
      initials: getInitials(otherParty.full_name),
      lastMessage: String(row.last_message_text || 'Open this conversation to start chatting.'),
      lastMessageTime: formatSummaryTime(row.last_message_at),
      unreadCount: unreadCounts[index] || 0,
      online: true,
    } satisfies ChatSummary;
  });
};

export const getCustomerChatSummaries = async (customerId: string): Promise<ChatSummary[]> => {
  const conversationRows = await tryLoadConversationRecords('customer', customerId);
  if (conversationRows?.length) {
    return enrichConversationSummaries(conversationRows, 'customer');
  }

  const bookings = await getCustomerBookings(customerId);
  const summaries = await Promise.all(
    (bookings || []).map(async (booking: any) => {
      const bookingId = String(booking.id);
      const otherPartyName = String(
        booking?.provider?.full_name || booking?.provider_name || 'Service Provider'
      );
      const otherPartyPhone = String(
        booking?.provider?.contact_number || booking?.provider_phone || ''
      );
      const serviceName = String(
        booking?.service?.title || booking?.service_name || 'Service Booking'
      );

      return buildSummaryFromBooking(
        bookingId,
        'customer',
        otherPartyName,
        otherPartyPhone,
        serviceName
      );
    })
  );

  return summaries.filter(Boolean) as ChatSummary[];
};

export const getProviderChatSummaries = async (providerId: string): Promise<ChatSummary[]> => {
  const conversationRows = await tryLoadConversationRecords('provider', providerId);
  if (conversationRows?.length) {
    return enrichConversationSummaries(conversationRows, 'provider');
  }

  const bookings = await getProviderBookings(providerId);
  const summaries = await Promise.all(
    bookings.map((booking) =>
      buildSummaryFromBooking(
        String(booking.id),
        'provider',
        booking.customer_name || 'Customer',
        String(booking.customer_contact || ''),
        booking.service_title || 'Service Booking'
      )
    )
  );

  return summaries.filter(Boolean) as ChatSummary[];
};

export const getChatThread = async (input: {
  bookingId: string;
  role: ChatRole;
  otherPartyName?: string;
  otherPartyPhone?: string;
  serviceName?: string;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  if (!bookingId) {
    throw new Error('Booking id is required for chat.');
  }

  const otherPartyName = input.otherPartyName || 'Service Contact';
  const serviceName = input.serviceName || 'Service Booking';

  const supabaseMessages =
    (await tryLoadConversationMessages(bookingId)) || (await tryLoadSupabaseMessages(bookingId));
  const mergedMessages = (
    supabaseMessages && supabaseMessages.length ? supabaseMessages : getMemoryMessages(bookingId)
  )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    id: buildConversationId(bookingId),
    bookingId,
    otherPartyName,
    otherPartyPhone: input.otherPartyPhone || '',
    serviceName,
    avatar: buildAvatar(`${bookingId}-${otherPartyName}`),
    initials: getInitials(otherPartyName),
    online: true,
    messages: mergedMessages,
  } satisfies ChatThread;
};

export const sendChatMessage = async (input: {
  bookingId: string;
  senderId: string;
  senderRole: ChatRole;
  text: string;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  const text = String(input.text || '').trim();

  if (!bookingId) throw new Error('Booking id is required.');
  if (!text) throw new Error('Message text cannot be empty.');

  const createdAt = new Date().toISOString();
  const nextMessage: ChatMessage = {
    id: `local-${createdAt}`,
    text,
    createdAt,
    timeLabel: formatTimeLabel(createdAt),
    sender: input.senderRole,
    deliveryStatus: 'sent',
  };

  const existing = getMemoryMessages(bookingId);
  setMemoryMessages(bookingId, [...existing, nextMessage]);
  setReadState(bookingId, input.senderRole, createdAt);

  try {
    let booking: any = null;

    const richBooking = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        provider_id,
        status,
        service_id,
        customer:users!bookings_customer_id_fkey(full_name, contact_number),
        provider:users!bookings_provider_id_fkey(full_name, contact_number),
        service:provider_services!bookings_service_id_fkey(title)
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (!richBooking.error && richBooking.data) {
      booking = richBooking.data;
    } else {
      const fallbackBooking = await supabase
        .from('bookings')
        .select('id,customer_id,provider_id,service_id,status')
        .eq('id', bookingId)
        .maybeSingle();
      booking = fallbackBooking.data;
    }

    const conversationId = await tryUpsertConversation({
      bookingId,
      customerId: booking?.customer_id,
      providerId: booking?.provider_id,
      serviceId: booking?.service_id,
      text,
      createdAt,
      ...(input.senderRole === 'customer'
        ? { customerLastReadAt: createdAt }
        : { providerLastReadAt: createdAt }),
    });

    const persisted = await tryPersistSupabaseMessage(
      bookingId,
      input.senderId,
      input.senderRole,
      text,
      conversationId
    );

    const finalMessage = {
      ...nextMessage,
      deliveryStatus: persisted ? 'delivered' : 'failed',
    } satisfies ChatMessage;

    replaceMemoryMessage(bookingId, nextMessage.id, finalMessage);

    const recipientUserId =
      input.senderRole === 'customer' ? booking?.provider_id : booking?.customer_id;
    const recipientRole = input.senderRole === 'customer' ? 'provider' : 'customer';
    const senderProfile =
      input.senderRole === 'customer' ? booking?.customer : booking?.provider;
    const serviceName = String(booking?.service?.title || 'Service Booking');
    const notificationTargets = buildNotificationTargets({
      bookingId,
      recipientRole,
      bookingStatus: booking?.status,
      senderName: String(senderProfile?.full_name || 'ServEase User'),
      senderPhone: String(senderProfile?.contact_number || ''),
      serviceName,
    });

    await createChatNotification({
      recipientUserId: String(recipientUserId || ''),
      recipientRole,
      actorId: input.senderId,
      bookingId,
      senderName: String(senderProfile?.full_name || 'ServEase User'),
      senderPhone: String(senderProfile?.contact_number || ''),
      serviceName,
      target: notificationTargets.target,
      fallbackTarget: notificationTargets.fallbackTarget,
      context: notificationTargets.context,
    });

    return finalMessage;
  } catch (error) {
    const failedMessage = {
      ...nextMessage,
      deliveryStatus: 'failed',
    } satisfies ChatMessage;

    replaceMemoryMessage(bookingId, nextMessage.id, failedMessage);
    console.warn(getErrorMessage(error, 'Failed to persist message to Supabase. Keeping local copy.'));
    return failedMessage;
  }
};

export const retryChatMessage = async (input: {
  bookingId: string;
  senderId: string;
  senderRole: ChatRole;
  messageId: string;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  const messageId = String(input.messageId || '').trim();

  if (!bookingId) throw new Error('Booking id is required.');
  if (!messageId) throw new Error('Message id is required.');

  const existingMessage = getMemoryMessages(bookingId).find((message) => message.id === messageId);
  if (!existingMessage) throw new Error('Message could not be found.');
  if (existingMessage.sender !== input.senderRole) {
    throw new Error('Only your own messages can be retried.');
  }

  const pendingMessage: ChatMessage = {
    ...existingMessage,
    deliveryStatus: 'sent',
  };
  replaceMemoryMessage(bookingId, messageId, pendingMessage);

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id,customer_id,provider_id,service_id')
      .eq('id', bookingId)
      .maybeSingle();

    const conversationId = await tryUpsertConversation({
      bookingId,
      customerId: booking?.customer_id,
      providerId: booking?.provider_id,
      serviceId: booking?.service_id,
      text: existingMessage.text,
      createdAt: existingMessage.createdAt,
      ...(input.senderRole === 'customer'
        ? { customerLastReadAt: existingMessage.createdAt }
        : { providerLastReadAt: existingMessage.createdAt }),
    });

    const persisted = await tryPersistSupabaseMessage(
      bookingId,
      input.senderId,
      input.senderRole,
      existingMessage.text,
      conversationId
    );

    const finalMessage: ChatMessage = {
      ...existingMessage,
      deliveryStatus: persisted ? 'delivered' : 'failed',
    };
    replaceMemoryMessage(bookingId, messageId, finalMessage);
    return finalMessage;
  } catch (error) {
    const failedMessage: ChatMessage = {
      ...existingMessage,
      deliveryStatus: 'failed',
    };
    replaceMemoryMessage(bookingId, messageId, failedMessage);
    console.warn(getErrorMessage(error, 'Failed to retry message. Keeping local copy.'));
    return failedMessage;
  }
};

export const markChatThreadRead = async (input: {
  bookingId: string;
  role: ChatRole;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  if (!bookingId) return;

  const readAt = new Date().toISOString();
  setReadState(bookingId, input.role, readAt);

  try {
    const column =
      input.role === 'customer' ? 'customer_last_read_at' : 'provider_last_read_at';
    const { error } = await supabase
      .from('conversations')
      .update({ [column]: readAt })
      .eq('booking_id', bookingId);

    if (error) {
      console.warn(getErrorMessage(error, 'Unable to update chat read status.'));
    }
  } catch (error) {
    console.warn(getErrorMessage(error, 'Unable to update chat read status.'));
  }
};

export const subscribeToChatThread = (input: {
  bookingId: string;
  onChange: () => void;
}): ChatSubscription => {
  const bookingId = String(input.bookingId || '').trim();
  if (!bookingId) return () => {};

  const refresh = scheduleRealtimeRefresh(input.onChange);
  const channel = supabase
    .channel(createChannelName('thread', bookingId))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `booking_id=eq.${bookingId}`,
      },
      () => refresh.trigger()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      () => refresh.trigger()
    )
    .subscribe();

  return () => {
    refresh.clear();
    void supabase.removeChannel(channel);
  };
};

export const subscribeToChatSummaries = (input: {
  role: ChatRole;
  userId: string;
  onChange: () => void;
}): ChatSubscription => {
  const userId = String(input.userId || '').trim();
  if (!userId) return () => {};

  const refresh = scheduleRealtimeRefresh(input.onChange);
  const filterColumn = input.role === 'customer' ? 'customer_id' : 'provider_id';
  const channel = supabase
    .channel(createChannelName(`${input.role}-summaries`, userId))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `${filterColumn}=eq.${userId}`,
      },
      () => refresh.trigger()
    )
    .subscribe();

  return () => {
    refresh.clear();
    void supabase.removeChannel(channel);
  };
};
