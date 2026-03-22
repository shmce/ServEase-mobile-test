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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

const BookingCard = ({ booking }: { booking: any }) => {
  const router = useRouter();
  const isCompleted = booking.status === 'Completed';
  const isCancelled = booking.status === 'Cancelled';
  const completedBookingPayload = {
    id: booking.id,
    service: booking.service,
    address: booking.address || '45 Mabini Ave, Pasig City',
    date: booking.date,
    year: booking.year || '2026',
    time: booking.time,
    status: booking.status,
    provider: {
      name: booking.providerName,
      rating: booking.providerRating,
      specialty: booking.service,
      avatar: booking.providerAvatar,
      isVerified: true,
    },
    providerName: booking.providerName,
  };

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
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              router.push({
                pathname: '/customer-review',
                params: { booking: JSON.stringify(completedBookingPayload) },
              } as any)
            }
          >
            <Ionicons name="star-outline" size={18} color="#00C853" style={{ marginRight: 8 }} />
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookAgainButton}
            onPress={() =>
              router.push({
                pathname: '/customer-book-again',
                params: { booking: JSON.stringify(completedBookingPayload) },
              } as any)
            }
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bookAgainButtonText}>Book Again</Text>
          </TouchableOpacity>
        </View>
      ) : isCancelled ? (
        <TouchableOpacity 
          style={styles.cancelledButton}
          onPress={() => router.push('/customer-booking-details' as any)}
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
              router.push('/customer-booking-details' as any);
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
  const [activeTab, setActiveTab] = useState<(typeof TAB_CONFIG)[number]['key']>('inProgress');
  const bookings = BOOKINGS_BY_TAB[activeTab];

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
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.bookingCount}>{bookings.length} bookings</Text>
        
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}

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
    flexDirection: 'row',
    gap: 12,
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
