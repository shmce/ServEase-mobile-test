import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getCustomerBookings } from '@/services/bookingService';

const IN_PROGRESS_BOOKINGS = [
  {
    id: '1',
    service: 'House Cleaning',
    providerName: 'Maria Santos',
    providerRating: 4.8,
    providerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60',
    price: '₱1,500.00',
    date: 'March 14, 2026',
    time: '10:00 AM',
    status: 'On the Way',
    statusType: 'warning', // orange
    actionLabel: 'Track Order',
    actionIcon: 'location-outline',
  },
  {
    id: '2',
    service: 'Plumbing Repair',
    providerName: 'Juan Dela Cruz',
    providerRating: 4.9,
    providerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60',
    price: '₱2,200.00',
    date: 'March 17, 2026',
    time: '2:00 PM',
    status: 'Confirmed',
    statusType: 'success', // light green
    actionLabel: 'View Details',
    actionIcon: 'calendar-outline',
  },
  {
    id: '3',
    service: 'Aircon Cleaning',
    providerName: 'Ricardo Gomez',
    providerRating: 4.7,
    providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60',
    price: '₱1,800.00',
    date: 'March 20, 2026',
    time: '9:00 AM',
    status: 'Confirmed',
    statusType: 'success',
    actionLabel: 'View Details',
    actionIcon: 'calendar-outline',
  },
];

const COMPLETED_BOOKINGS = [
  {
    id: '4',
    service: 'Painting Service',
    providerName: 'Carlos Fernandez',
    providerRating: 4.7,
    providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
    price: '₱3,500.00',
    date: 'March 10, 2026',
    time: '11:00 AM',
    status: 'Completed',
    statusType: 'success',
  },
  {
    id: '5',
    service: 'Plumbing Repair',
    providerName: 'Lisa Martinez',
    providerRating: 4.9,
    providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60',
    price: '₱1,800.00',
    date: 'March 8, 2026',
    time: '8:00 AM',
    status: 'Completed',
    statusType: 'success',
  },
  {
    id: '6',
    service: 'Deep House Cleaning',
    providerName: 'Maria Santos',
    providerRating: 4.8,
    providerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60',
    price: '₱2,200.00',
    date: 'March 5, 2026',
    time: '9:30 AM',
    status: 'Completed',
    statusType: 'success',
  },
];

const CANCELLED_BOOKINGS = [
  {
    id: '7',
    service: 'Sofa Deep Cleaning',
    providerName: 'Angela Reyes',
    providerRating: 4.6,
    providerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60',
    price: '₱1,300.00',
    date: 'March 6, 2026',
    time: '1:30 PM',
    status: 'Cancelled',
    statusType: 'cancelled',
    actionLabel: 'View Details',
    actionIcon: 'document-text-outline',
  },
  {
    id: '8',
    service: 'Electrical Repair',
    providerName: 'Mark Villanueva',
    providerRating: 4.8,
    providerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60',
    price: '₱2,600.00',
    date: 'March 2, 2026',
    time: '4:00 PM',
    status: 'Cancelled',
    statusType: 'cancelled',
    actionLabel: 'View Details',
    actionIcon: 'document-text-outline',
  },
];

const TAB_CONFIG = [
  {
    key: 'inProgress',
    label: 'In Progress',
    icon: 'location-outline',
    count: IN_PROGRESS_BOOKINGS.length,
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'checkmark-circle-outline',
    count: COMPLETED_BOOKINGS.length,
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: 'close-circle-outline',
    count: CANCELLED_BOOKINGS.length,
  },
] as const;

const BOOKINGS_BY_TAB = {
  inProgress: IN_PROGRESS_BOOKINGS,
  completed: COMPLETED_BOOKINGS,
  cancelled: CANCELLED_BOOKINGS,
} as const;

const buildBookingPayload = (booking: any) => ({
  id: booking.id,
  service: booking.service,
  address: booking.address || '45 Mabini Ave, Pasig City',
  date: booking.date,
  year: booking.year || '2026',
  time: booking.time,
  status: booking.status,
  totalAmount: booking.price?.replace('₱', '').replace(',', '') || '1,500.00',
  countdown: {
    days: '3',
    hours: '4',
    mins: '19',
  },
  provider: {
    name: booking.providerName,
    rating: booking.providerRating,
    specialty: booking.service,
    avatar: booking.providerAvatar,
    isVerified: true,
  },
  providerName: booking.providerName,
});

const formatScheduledDate = (value?: string | null) => {
  if (!value) return { date: 'N/A', time: 'N/A' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: 'N/A', time: 'N/A' };
  return {
    date: parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};

const BookingCard = ({ booking }: { booking: any }) => {
  const router = useRouter();
  const isCompleted = booking.status === 'Completed';
  const isCancelled = booking.status === 'Cancelled';
  const bookingPayload = buildBookingPayload(booking);

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceTitle}>{booking.service}</Text>
        <View style={[
          styles.statusBadge, 
          booking.statusType === 'warning' && styles.statusWarning,
          booking.statusType === 'success' && styles.statusSuccess,
          booking.statusType === 'completed' && styles.statusCompleted,
          booking.statusType === 'cancelled' && styles.statusCancelled,
        ]}>
          <Text style={[
            styles.statusText,
            booking.statusType === 'warning' && styles.statusTextWarning,
            booking.statusType === 'success' && styles.statusTextSuccess,
            booking.statusType === 'completed' && styles.statusTextCompleted,
            booking.statusType === 'cancelled' && styles.statusTextCancelled,
          ]}>{booking.status}</Text>
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

      {isCompleted ? (
        <View style={styles.completedActions}>
          <View style={styles.completedPrimaryActions}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                router.push({
                  pathname: '/customer-booking-details',
                  params: { booking: JSON.stringify(bookingPayload) },
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
              params: { booking: JSON.stringify(bookingPayload) },
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
          onPress={() => {
            if (booking.actionLabel === 'Track Order') {
              router.push('/customer-track-order' as any);
            } else if (booking.actionLabel === 'View Details') {
              router.push({
                pathname: '/customer-booking-details',
                params: { booking: JSON.stringify(bookingPayload) },
              } as any);
            }
          }}
        >
          <Ionicons name={booking.actionIcon} size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>{booking.actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof TAB_CONFIG)[number]['key']>('inProgress');

  useFocusEffect(
    React.useCallback(() => {
      async function loadBookings() {
        if (!user) {
          setLiveBookings([]);
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const data = await getCustomerBookings(user.id);
          setLiveBookings(data || []);
        } catch (error) {
          console.error('Failed to load bookings:', error);
          setLiveBookings([]);
        } finally {
          setIsLoading(false);
        }
      }
      loadBookings();
    }, [user])
  );

  const mappedLiveBookings = useMemo(() => {
    return liveBookings.map((item: any, idx: number) => {
      const providerName = item?.provider?.full_name || item?.provider_name || 'Service Provider';
      const providerRating = Number(item?.provider_rating || 4.8);
      const statusRaw = String(item?.status || 'Pending');
      const statusLower = statusRaw.toLowerCase();
      const statusType = statusLower.includes('cancel')
        ? 'cancelled'
        : statusLower.includes('complete')
          ? 'completed'
          : statusLower.includes('way')
            ? 'warning'
            : 'success';

      const actionLabel = statusType === 'cancelled'
        ? 'View Details'
        : statusType === 'completed'
          ? 'View Details'
          : statusLower.includes('way')
            ? 'Track Order'
            : 'View Details';

      const actionIcon = actionLabel === 'Track Order' ? 'location-outline' : 'calendar-outline';
      const schedule = formatScheduledDate(item?.scheduled_at);

      return {
        id: String(item.id || idx + 1),
        service: item?.service?.title || item?.service_name || 'Service Booking',
        providerName,
        providerRating,
        providerAvatar: item?.provider_avatar || 'https://i.pravatar.cc/100?img=12',
        price: `P${item?.service?.price || item?.total_amount || '0.00'}`,
        date: schedule.date,
        time: schedule.time,
        status: statusRaw,
        statusType,
        actionLabel,
        actionIcon,
        address: item?.service_address || '',
      };
    });
  }, [liveBookings]);

  const bookingsByTab = useMemo(() => {
    if (!mappedLiveBookings.length) return BOOKINGS_BY_TAB;
    return {
      inProgress: mappedLiveBookings.filter((b) => !['completed', 'cancelled'].includes(String(b.statusType))),
      completed: mappedLiveBookings.filter((b) => String(b.statusType) === 'completed'),
      cancelled: mappedLiveBookings.filter((b) => String(b.statusType) === 'cancelled'),
    };
  }, [mappedLiveBookings]);

  const tabConfig = useMemo(() => {
    if (!mappedLiveBookings.length) return TAB_CONFIG;
    return [
      { key: 'inProgress', label: 'In Progress', icon: 'location-outline', count: bookingsByTab.inProgress.length },
      { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline', count: bookingsByTab.completed.length },
      { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline', count: bookingsByTab.cancelled.length },
    ] as const;
  }, [bookingsByTab, mappedLiveBookings.length]);

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

      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                numberOfLines={1}
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
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
              <BookingCard key={booking.id} booking={booking} />
            ))}
            {!bookings.length ? (
              <Text style={{ textAlign: 'center', color: '#8E8E93', marginTop: 20 }}>
                No bookings found for this tab.
              </Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1B1E',
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
});

