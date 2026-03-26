import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getCustomerBookings } from '@/services/bookingService';
import { getCustomerBookingPresentation } from '@/lib/booking-status';
import {
  getCustomerChatSummaries,
  subscribeToChatSummaries,
  type ChatSummary,
} from '@/services/chatService';

type BookingTab = 'inProgress' | 'completed' | 'cancelled';

type CustomerBookingCard = {
  id: string;
  providerId?: string;
  service: string;
  providerName: string;
  providerRating: string;
  providerAvatar: string;
  price: string;
  date: string;
  time: string;
  status: string;
  address: string;
};

const formatScheduledDate = (value?: string | null) => {
  if (!value) return { date: 'N/A', time: 'N/A' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: 'N/A', time: 'N/A' };
  return {
    date: parsed.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
};

const buildBookingPayload = (booking: CustomerBookingCard) => ({
  id: booking.id,
  providerId: booking.providerId || '',
  service: booking.service,
  address: booking.address,
  date: booking.date,
  year: booking.date.split(', ').at(-1) || '',
  time: booking.time,
  status: booking.status,
  totalAmount:
    booking.price.replace('P', '').replace('₱', '').replaceAll(',', '').trim() || '0.00',
  provider: {
    name: booking.providerName,
    rating: booking.providerRating,
    specialty: booking.service,
    avatar: booking.providerAvatar,
    isVerified: true,
  },
  providerName: booking.providerName,
});

function BookingCard({
  booking,
  chatSummary,
}: {
  booking: CustomerBookingCard;
  chatSummary?: ChatSummary | null;
}) {
  const router = useRouter();
  const presentation = getCustomerBookingPresentation(booking.status);
  const bookingPayload = buildBookingPayload(booking);
  const needsReply = Boolean((chatSummary?.unreadCount || 0) > 0);
  const isCompleted = presentation.normalizedStatus === 'completed';
  const isCancelled = presentation.normalizedStatus === 'cancelled';

  return (
    <View style={[styles.bookingCard, needsReply && styles.bookingCardAttention]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.serviceTitle}>{booking.service}</Text>
          {needsReply ? (
            <View style={styles.attentionChip}>
              <Text style={styles.attentionChipText}>Needs reply</Text>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            presentation.tone === 'warning' && styles.statusWarning,
            presentation.tone === 'success' && styles.statusSuccess,
            presentation.tone === 'completed' && styles.statusCompleted,
            presentation.tone === 'cancelled' && styles.statusCancelled,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              presentation.tone === 'warning' && styles.statusTextWarning,
              presentation.tone === 'success' && styles.statusTextSuccess,
              presentation.tone === 'completed' && styles.statusTextCompleted,
              presentation.tone === 'cancelled' && styles.statusTextCancelled,
            ]}
          >
            {presentation.label}
          </Text>
        </View>
      </View>

      <View style={styles.providerRow}>
        <Image source={{ uri: booking.providerAvatar }} style={styles.providerAvatar} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{booking.providerName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFA000" />
            <Text style={styles.ratingText}>{booking.providerRating}</Text>
          </View>
        </View>
        <Text style={styles.priceText}>{booking.price}</Text>
      </View>

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Ionicons name="calendar-outline" size={16} color="#999" style={{ marginRight: 6 }} />
          <Text style={styles.dateTimeText}>{booking.date}</Text>
        </View>
        <View style={styles.dateTimeDivider} />
        <View style={styles.dateTimeItem}>
          <Ionicons name="time-outline" size={16} color="#999" style={{ marginRight: 6 }} />
          <Text style={styles.dateTimeText}>{booking.time}</Text>
        </View>
      </View>

      {chatSummary ? (
        <TouchableOpacity
          style={styles.contactRow}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/customer-chat',
              params: {
                id: booking.id,
                providerName: booking.providerName,
                serviceName: booking.service,
              },
            } as any)
          }
        >
          <View style={styles.contactRowText}>
            <Text style={styles.contactRowTitle}>Last contact {chatSummary.lastMessageTime}</Text>
            <Text style={styles.contactRowBody} numberOfLines={1}>
              {chatSummary.lastMessage}
            </Text>
          </View>
          {chatSummary.unreadCount > 0 ? (
            <View style={styles.contactUnreadBadge}>
              <Text style={styles.contactUnreadBadgeText}>
                {chatSummary.unreadCount > 9 ? '9+' : chatSummary.unreadCount}
              </Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      ) : null}

      {isCompleted ? (
        <View style={styles.completedActions}>
          <View style={styles.completedPrimaryActions}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                router.push({
                  pathname: '/customer-booking-details',
                  params: { id: booking.id, booking: JSON.stringify(bookingPayload) },
                } as any)
              }
            >
              <Ionicons name="document-text-outline" size={18} color="#00C853" style={{ marginRight: 8 }} />
              <Text style={styles.reviewButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookAgainButton}
              onPress={() =>
                router.push({
                  pathname: '/customer-book-again',
                  params: { booking: JSON.stringify(bookingPayload) },
                } as any)
              }
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.bookAgainButtonText}>Book Again</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.completedSecondaryButton}
            onPress={() =>
              router.push({
                pathname: '/customer-review',
                params: { booking: JSON.stringify(bookingPayload) },
              } as any)
            }
          >
            <Ionicons name="star-outline" size={18} color="#00C853" style={{ marginRight: 8 }} />
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      ) : isCancelled ? (
        <TouchableOpacity
          style={styles.cancelledButton}
          onPress={() =>
            router.push({
              pathname: '/customer-booking-details',
              params: { id: booking.id, booking: JSON.stringify(bookingPayload) },
            } as any)
          }
        >
          <Ionicons name="document-text-outline" size={18} color="#C62828" style={{ marginRight: 8 }} />
          <Text style={styles.cancelledButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(198,40,40,0.7)" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            router.push({
              pathname: presentation.actionLabel === 'Track Order' ? '/customer-track-order' : '/customer-booking-details',
              params: { id: booking.id, booking: JSON.stringify(bookingPayload) },
            } as any)
          }
        >
          <Ionicons name={presentation.actionIcon} size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>{presentation.actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [activeTab, setActiveTab] = useState<BookingTab>('inProgress');

  const loadBookings = React.useCallback(async () => {
    if (!user?.id) {
      setLiveBookings([]);
      setChatSummaries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [data, summaries] = await Promise.all([
        getCustomerBookings(user.id),
        getCustomerChatSummaries(user.id),
      ]);
      setLiveBookings(data || []);
      setChatSummaries(summaries || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setLiveBookings([]);
      setChatSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadChatSummaries = React.useCallback(async () => {
    if (!user?.id) {
      setChatSummaries([]);
      return;
    }

    try {
      const rows = await getCustomerChatSummaries(user.id);
      setChatSummaries(rows);
    } catch {
      setChatSummaries([]);
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      void loadBookings();
    }, [loadBookings])
  );

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`customer-bookings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'booking_svc',
          table: 'bookings',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          void loadBookings();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBookings, user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;

    return subscribeToChatSummaries({
      role: 'customer',
      userId: user.id,
      onChange: () => {
        void loadChatSummaries();
      },
    });
  }, [loadChatSummaries, user?.id]);

  const mappedLiveBookings = useMemo<CustomerBookingCard[]>(() => {
    return liveBookings.map((item: any, idx: number) => {
      const providerName = item?.provider?.full_name || item?.provider_name || 'Service Provider';
      const providerRating = Number(item?.provider_rating || 4.8).toFixed(1);
      const statusRaw = String(item?.status || 'Pending');
      const schedule = formatScheduledDate(item?.scheduled_at);

      return {
        id: String(item.id || idx + 1),
        providerId: String(item?.provider_id || ''),
        service: item?.service?.title || item?.service_name || 'Service Booking',
        providerName,
        providerRating,
        providerAvatar: item?.provider_avatar || `https://i.pravatar.cc/100?u=${providerName}`,
        price: `P${Number(item?.service?.price || item?.total_amount || 0).toFixed(2)}`,
        date: schedule.date,
        time: schedule.time,
        status: statusRaw,
        address: item?.service_address || '',
      };
    });
  }, [liveBookings]);

  const chatSummaryMap = useMemo(
    () => new Map(chatSummaries.map((summary) => [summary.bookingId, summary])),
    [chatSummaries]
  );

  const sortBookingsByAttention = React.useCallback(
    (rows: CustomerBookingCard[]) =>
      [...rows].sort((left, right) => {
        const leftUnread = chatSummaryMap.get(String(left.id))?.unreadCount || 0;
        const rightUnread = chatSummaryMap.get(String(right.id))?.unreadCount || 0;
        return rightUnread - leftUnread;
      }),
    [chatSummaryMap]
  );

  const bookingsByTab = useMemo(
    () => ({
      inProgress: sortBookingsByAttention(
        mappedLiveBookings.filter(
          (booking) => getCustomerBookingPresentation(booking.status).tab === 'inProgress'
        )
      ),
      completed: sortBookingsByAttention(
        mappedLiveBookings.filter(
          (booking) => getCustomerBookingPresentation(booking.status).tab === 'completed'
        )
      ),
      cancelled: sortBookingsByAttention(
        mappedLiveBookings.filter(
          (booking) => getCustomerBookingPresentation(booking.status).tab === 'cancelled'
        )
      ),
    }),
    [mappedLiveBookings, sortBookingsByAttention]
  );

  const tabConfig = useMemo(
    () =>
      [
        { key: 'inProgress', label: 'In Progress', icon: 'location-outline', count: bookingsByTab.inProgress.length },
        { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline', count: bookingsByTab.completed.length },
        { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline', count: bookingsByTab.cancelled.length },
      ] as const,
    [bookingsByTab]
  );

  const bookings = bookingsByTab[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabContainer}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text numberOfLines={1} style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
              <View style={[styles.countBadge, isActive ? styles.activeCountBadge : styles.inactiveCountBadge]}>
                <Text style={[styles.countText, isActive ? styles.activeCountText : styles.inactiveCountText]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.bookingCount}>{bookings.length} bookings</Text>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                chatSummary={chatSummaryMap.get(String(booking.id)) || null}
              />
            ))}
            {!bookings.length ? (
              <Text style={styles.emptyText}>No bookings found for this tab.</Text>
            ) : null}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 6,
    marginBottom: 15,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 8,
    minWidth: 0,
  },
  activeTab: {
    backgroundColor: '#00C853',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  activeTabText: {
    color: '#fff',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  inactiveCountBadge: {
    backgroundColor: '#E5E7EB',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeCountText: {
    color: '#fff',
  },
  inactiveCountText: {
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 25,
  },
  bookingCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bookingCardAttention: {
    borderWidth: 1,
    borderColor: '#BDE4CD',
    backgroundColor: '#FCFFFD',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1B1E',
  },
  attentionChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E8FBF2',
  },
  attentionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B761',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusWarning: {
    backgroundColor: '#FFF3E0',
  },
  statusSuccess: {
    backgroundColor: '#E8FBF2',
  },
  statusCompleted: {
    backgroundColor: '#E3F2FD',
  },
  statusCancelled: {
    backgroundColor: '#FDECEC',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextWarning: {
    color: '#E65100',
  },
  statusTextSuccess: {
    color: '#00C853',
  },
  statusTextCompleted: {
    color: '#1976D2',
  },
  statusTextCancelled: {
    color: '#C62828',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1B1E',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00C853',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  dateTimeDivider: {
    width: 1,
    height: 15,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5F7EA',
  },
  contactRowText: {
    flex: 1,
    marginRight: 10,
  },
  contactRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  contactRowBody: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  contactUnreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  contactUnreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  actionButton: {
    backgroundColor: '#00C853',
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelledButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F5C2C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  cancelledButtonText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: 'bold',
  },
  completedActions: {
    gap: 12,
  },
  completedPrimaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completedSecondaryButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  reviewButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  reviewButtonText: {
    color: '#00C853',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bookAgainButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookAgainButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 20,
  },
});
