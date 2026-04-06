import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_CLIENT,
  IDENTITY_CLIENT,
  NOTIFICATION_CLIENT,
  CATALOG_CLIENT,
} from '../../database/supabase.module';
import { getResult, getMaybeSingle } from '../../common/utils/database.utils';
import {
  Booking,
  User,
  ProviderService,
} from '../../common/interfaces/database.interfaces';

type ConvRow = {
  id: string;
  booking_id: string;
  provider_id: string;
  customer_id: string;
  last_message_at: string | null;
  customer_last_read_at: string | null;
  provider_last_read_at: string | null;
};

type MsgRow = {
  id: string;
  conversation_id: string;
  booking_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  delivery_status: string;
};

@Injectable()
export class ChatService {
  constructor(
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationDb: SupabaseClient,
  ) {}

  async getConversations(userId: string, role: 'customer' | 'provider') {
    const filterCol = role === 'customer' ? 'customer_id' : 'provider_id';
    const rows = (await getResult<any[]>(
      this.bookingDb
        .from('conversations')
        .select('*')
        .eq(filterCol, userId)
        .order('last_message_at', { ascending: false, nullsFirst: false }),
      'ChatConversations',
      { allowEmpty: true },
    )) as ConvRow[];

    if (!rows.length) return [];

    // Collect other-party user IDs
    const otherPartyIds = rows
      .map((c) => (role === 'customer' ? c.provider_id : c.customer_id))
      .filter(Boolean);

    const uniqueIds = [...new Set(otherPartyIds)] as string[];

    const users = await getResult<Partial<User>[]>(
      this.identityDb
        .from('users')
        .select('id,full_name,contact_number')
        .in('id', uniqueIds),
      'ChatOtherParty',
      { allowEmpty: true },
    );

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    // Collect service names from bookings
    const bookingIds = rows.map((c) => c.booking_id).filter(Boolean);
    const uniqueBookingIds = [...new Set(bookingIds)] as string[];

    const bookings = await getResult<Partial<Booking>[]>(
      this.bookingDb
        .from('bookings')
        .select('id,service_id')
        .in('id', uniqueBookingIds),
      'ChatBookings',
      { allowEmpty: true },
    );

    const bookingMap = new Map((bookings || []).map((b) => [b.id, b]));
    const serviceIds = [
      ...new Set((bookings || []).map((b) => b.service_id).filter(Boolean)),
    ] as string[];
    const services = serviceIds.length
      ? await getResult<Partial<ProviderService>[]>(
          this.catalogDb
            .from('provider_services')
            .select('id,title')
            .in('id', serviceIds),
          'ChatServices',
          { allowEmpty: true },
        )
      : [];
    const serviceMap = new Map(
      (services || []).map((service) => [service.id, service]),
    );

    // Load latest messages and unread counts
    const conversationIds = rows.map((c) => c.id).filter(Boolean);
    const allMessages = (await getResult<any[]>(
      this.bookingDb
        .from('messages')
        .select(
          'id,conversation_id,booking_id,sender_role,body,created_at,delivery_status',
        )
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(200),
      'ChatLatestMessages',
      { allowEmpty: true },
    )) as MsgRow[];

    const messagesByConversation = new Map<string, MsgRow[]>();
    for (const msg of allMessages || []) {
      const convId = String(msg.conversation_id);
      if (!messagesByConversation.has(convId)) {
        messagesByConversation.set(convId, []);
      }
      messagesByConversation.get(convId)!.push(msg);
    }

    return rows.map((conv) => {
      const otherPartyId =
        role === 'customer' ? conv.provider_id : conv.customer_id;
      const otherPartyUser = userMap.get(otherPartyId);
      const lastReadAt =
        role === 'customer'
          ? conv.customer_last_read_at
          : conv.provider_last_read_at;

      const convMessages = messagesByConversation.get(String(conv.id)) || [];
      // convMessages are ordered desc — first is latest
      const latestMsg = convMessages[0] || null;

      const unreadCount = convMessages.filter((m) => {
        if (String(m.sender_role || '') === role) return false;
        if (!lastReadAt) return true;
        return (
          new Date(m.created_at).getTime() > new Date(lastReadAt).getTime()
        );
      }).length;

      const bookingRow = bookingMap.get(String(conv.booking_id));
      const serviceRow = bookingRow?.service_id
        ? serviceMap.get(String(bookingRow.service_id))
        : null;
      return {
        id: String(conv.id),
        bookingId: String(conv.booking_id || ''),
        otherPartyId: String(otherPartyId || ''),
        otherPartyName: String(otherPartyUser?.full_name || 'Service Contact'),
        otherPartyPhone: String(otherPartyUser?.contact_number || ''),
        serviceName: String(serviceRow?.title || 'Service Booking'),
        lastMessage: latestMsg
          ? String(latestMsg.body || '')
          : 'Open chat to continue the conversation.',
        lastMessageTime: latestMsg
          ? String(latestMsg.created_at || '')
          : String(conv.last_message_at || ''),
        unreadCount,
      };
    });
  }

  async getThread(bookingId: string, userId: string) {
    await this.assertParticipant(bookingId, userId);

    // Get conversation row for bookingId
    const conv = (await getMaybeSingle<any>(
      this.bookingDb
        .from('conversations')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle(),
      'ChatConvLookup',
    )) as ConvRow | null;

    // Get all messages for this conversation
    const messages: MsgRow[] = conv?.id
      ? ((await getResult<any[]>(
          this.bookingDb
            .from('messages')
            .select('id,body,sender_role,created_at,delivery_status')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true }),
          'ChatMessages',
          { allowEmpty: true },
        )) as MsgRow[])
      : [];

    // Get booking to find other party
    const booking = await getResult<
      Pick<
        Booking,
        'id' | 'customer_id' | 'provider_id' | 'service_id' | 'status'
      >
    >(
      this.bookingDb
        .from('bookings')
        .select('id,customer_id,provider_id,service_id,status')
        .eq('id', bookingId)
        .single(),
      'ChatBookingLookup',
    );

    // Determine other party id
    const otherPartyId =
      booking.customer_id === userId
        ? booking.provider_id
        : booking.customer_id;

    let otherPartyName = 'Service Contact';
    let otherPartyPhone = '';
    let serviceName = 'Service Booking';

    if (otherPartyId) {
      const otherUser = await getMaybeSingle<Partial<User>>(
        this.identityDb
          .from('users')
          .select('full_name,contact_number')
          .eq('id', otherPartyId)
          .maybeSingle(),
        'ChatOtherUser',
      );
      if (otherUser) {
        otherPartyName = String(otherUser.full_name || 'Service Contact');
        otherPartyPhone = String(otherUser.contact_number || '');
      }
    }

    if (booking.service_id) {
      const service = await getMaybeSingle<Partial<ProviderService>>(
        this.catalogDb
          .from('provider_services')
          .select('title')
          .eq('id', booking.service_id)
          .maybeSingle(),
        'ChatThreadService',
      );
      if (service?.title) {
        serviceName = String(service.title);
      }
    }

    return {
      id: conv ? String(conv.id) : `booking:${bookingId}`,
      bookingId,
      otherPartyId: String(otherPartyId || ''),
      otherPartyName,
      otherPartyPhone,
      serviceName,
      messages: messages.map((m) => ({
        id: String(m.id),
        text: String(m.body || ''),
        createdAt: String(m.created_at),
        sender:
          String(m.sender_role || '').toLowerCase() === 'provider'
            ? ('provider' as const)
            : ('customer' as const),
        deliveryStatus: this.normalizeDeliveryStatus(m.delivery_status),
      })),
    };
  }

  async sendMessage(bookingId: string, senderId: string, text: string) {
    const booking = await this.assertParticipant(bookingId, senderId);

    const senderRole: 'customer' | 'provider' =
      booking.customer_id === senderId ? 'customer' : 'provider';
    const otherPartyId =
      senderRole === 'customer' ? booking.provider_id : booking.customer_id;

    // Upsert conversation
    const upserted = await getMaybeSingle<{ id: string }>(
      this.bookingDb
        .from('conversations')
        .upsert(
          {
            booking_id: bookingId,
            customer_id: booking.customer_id,
            provider_id: booking.provider_id,
            last_message_text: text,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: 'booking_id' },
        )
        .select('id')
        .maybeSingle(),
      'ChatConvUpsert',
    );

    const conversationId = upserted?.id;

    // Insert message
    const msg = await getResult<MsgRow>(
      this.bookingDb
        .from('messages')
        .insert({
          conversation_id: conversationId || null,
          booking_id: bookingId,
          sender_id: senderId,
          sender_role: senderRole,
          body: text,
          delivery_status: 'sent',
        })
        .select('*')
        .single(),
      'ChatMessageInsert',
    );

    // Create notification for other party
    if (otherPartyId) {
      await this.notificationDb.from('notifications').insert({
        user_id: otherPartyId,
        actor_id: senderId,
        booking_id: bookingId,
        type: 'chat_message',
        title: 'New Message',
        body: text.slice(0, 100),
        is_read: false,
      });
    }

    return msg;
  }

  async markThreadRead(bookingId: string, userId: string) {
    const booking = await this.assertParticipant(bookingId, userId);

    const role: 'customer' | 'provider' =
      booking.customer_id === userId ? 'customer' : 'provider';

    const column =
      role === 'customer' ? 'customer_last_read_at' : 'provider_last_read_at';

    await this.bookingDb
      .from('conversations')
      .update({ [column]: new Date().toISOString() })
      .eq('booking_id', bookingId);

    return { success: true };
  }

  private async assertParticipant(bookingId: string, userId: string) {
    const booking = await getResult<
      Pick<Booking, 'id' | 'customer_id' | 'provider_id' | 'service_id'>
    >(
      this.bookingDb
        .from('bookings')
        .select('id,customer_id,provider_id,service_id')
        .eq('id', bookingId)
        .single(),
      'ChatParticipantCheck',
      { notFoundMessage: 'Booking not found.' },
    );

    if (booking.customer_id !== userId && booking.provider_id !== userId) {
      throw new ForbiddenException(
        'You are not a participant in this booking.',
      );
    }
    return booking;
  }

  private normalizeDeliveryStatus(
    value: unknown,
  ): 'sent' | 'delivered' | 'failed' {
    const status = (typeof value === 'string' ? value : '').toLowerCase();
    if (status === 'sent' || status === 'failed') return status;
    return 'delivered';
  }
}
