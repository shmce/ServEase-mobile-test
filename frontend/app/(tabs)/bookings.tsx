import React, { useState } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

// Mock data removed in favor of real Supabase data.
const mapStatusToType = (status: string): 'warning' | 'success' | 'completed' | 'cancelled' => {
  const s = status.toLowerCase();
  switch (s) {
    case 'pending':
    case 'on_the_way':
    case 'in_progress':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'warning';
  }
};

const TAB_CONFIG = [
  {
    key: 'inProgress',
    label: 'In Progress',
    icon: 'location-outline',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: 'close-circle-outline',
  },
] as const;

const buildBookingPayload = (booking: any) => ({
  id: booking.id,
  providerId: booking.providerId,
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
  const [activeTab, setActiveTab] = useState<(typeof TAB_CONFIG)[number]['key']>('inProgress');
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          provider:provider_profiles(user_profiles(full_name, avatar_url))
        `)
        .eq('customer_id', user.id);

      if (data && !error) {
        const formatted = data.map(b => ({
          id: b.id,
          providerId: b.provider_id,
          service: b.service_name || 'Service',
          providerName: b.provider?.user_profiles?.full_name || 'Provider',
          providerRating: 4.9, // Placeholder
          providerAvatar: b.provider?.user_profiles?.avatar_url || 'https://via.placeholder.com/150',
          price: `₱${(b.total_price || 0).toLocaleString()}`,
          address: b.address || 'Consultation',
          date: new Date(b.scheduled_at || b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: new Date(b.scheduled_at || b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: b.status.charAt(0).toUpperCase() + b.status.slice(1).replace(/_/g, ' '),
          statusType: mapStatusToType(b.status),
          actionLabel: b.status === 'pending' || b.status === 'confirmed' ? 'View Details' : 'Track Order',
          actionIcon: b.status === 'pending' || b.status === 'confirmed' ? 'calendar-outline' : 'location-outline',
        }));
        setAllBookings(formatted);
      }
      setIsLoading(false);
    }
    fetchBookings();
  }, [user]);

  const filteredBookings = allBookings.filter(b => {
    if (activeTab === 'inProgress') return b.statusType === 'warning' || b.statusType === 'success';
    if (activeTab === 'completed') return b.statusType === 'completed';
    if (activeTab === 'cancelled') return b.statusType === 'cancelled';
    return false;
  });

  const counts = {
    inProgress: allBookings.filter(b => b.statusType === 'warning' || b.statusType === 'success').length,
    completed: allBookings.filter(b => b.statusType === 'completed').length,
    cancelled: allBookings.filter(b => b.statusType === 'cancelled').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        {TAB_CONFIG.map((tab) => {
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
                  {counts[tab.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00C853" />
            <Text style={{ marginTop: 10, color: '#999' }}>Loading your bookings...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.bookingCount}>{filteredBookings.length} bookings</Text>
            
            {filteredBookings.length === 0 ? (
              <View style={{ marginTop: 60, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={64} color="#E5E7EB" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#999', fontWeight: '600' }}>No bookings found</Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: '#CCC' }}>Your {activeTab === 'inProgress' ? 'active' : activeTab} bookings will appear here</Text>
              </View>
            ) : (
              filteredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
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
