import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, FlatList, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { fetchProviderBookingViews } from '@/lib/provider-booking';

const { width } = Dimensions.get('window');

const TABS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'] as const;
type Tab = typeof TABS[number];

const mapDbStatusToTab = (status: string): Tab => {
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'confirmed' || s === 'on_the_way') return 'Upcoming';
  if (s === 'in_progress') return 'In Progress';
  if (s === 'completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return 'Upcoming';
};

const BookingCard = ({ item }: { item: any }) => {
  const router = useRouter();
  
  const statusLower = item.statusRaw.toLowerCase();
  const isPending = statusLower === 'pending';
  const isConfirmed = statusLower === 'confirmed';
  const isInProgress = statusLower === 'in_progress';
  const isOnTheWay = statusLower === 'on_the_way';
  
  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>{item.id.slice(0, 8).toUpperCase()}</Text>
        <View style={[
          styles.statusBadge, 
          isConfirmed || statusLower === 'completed' ? styles.confirmedBadge : 
          isInProgress || isOnTheWay ? styles.inProgressBadge :
          styles.pendingBadge
        ]}>
          <Text style={[
            styles.statusText, 
            isConfirmed || statusLower === 'completed' ? styles.confirmedText : 
            isInProgress || isOnTheWay ? styles.inProgressText :
            styles.pendingText
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.serviceName}>{item.service}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#777" />
          <Text style={styles.detailText}>{item.date} at {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#777" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₱{item.amount}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          {item.tab === 'Upcoming' || item.tab === 'In Progress' ? (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: item.id } } as any)}
            >
              <Text style={styles.viewDetailsText}>Manage Booking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.viewDetailsButtonOutline}
              onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: item.id } } as any)}
            >
              <Text style={styles.viewDetailsTextOutline}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      setIsLoading(true);

      try {
        const data = await fetchProviderBookingViews(user.id);
        const formatted = data.map((booking) => ({
          ...booking,
          tab: mapDbStatusToTab(booking.statusRaw),
        }));
        setBookings(formatted);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookings();
  }, [user]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(item => 
      item.tab === activeTab &&
      (item.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [bookings, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      Upcoming: bookings.filter(b => b.tab === 'Upcoming').length,
      'In Progress': bookings.filter(b => b.tab === 'In Progress').length,
      Completed: bookings.filter(b => b.tab === 'Completed').length,
      Cancelled: bookings.filter(b => b.tab === 'Cancelled').length,
    };
  }, [bookings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {counts[tab] > 0 && (
                <View style={[styles.badge, activeTab !== tab && styles.greyBadge]}>
                  <Text style={styles.badgeText}>{counts[tab]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00B761" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookingCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#EEE" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  tabsContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#00B761',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#00B761',
  },
  badge: {
    backgroundColor: '#00B761',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  greyBadge: {
    backgroundColor: '#DDD',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0D1B2A',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedBadge: {
    backgroundColor: '#E8FBF2',
  },
  inProgressBadge: {
    backgroundColor: '#EBF5FF',
  },
  pendingBadge: {
    backgroundColor: '#FFF9E6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  confirmedText: {
    color: '#00B761',
  },
  inProgressText: {
    color: '#007AFF',
  },
  pendingText: {
    color: '#FFB800',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  serviceName: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    marginLeft: 8,
    fontWeight: '500',
  },
  distanceText: {
    color: '#00B761',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#00B761',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: 160,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewDetailsButtonOutline: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    width: 160,
    alignItems: 'center',
  },
  viewDetailsTextOutline: {
    color: '#0D1B2A',
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#00B761',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewDetailsButton: {
    backgroundColor: '#00B761',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    width: 140,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00B761',
    width: 140,
  },
  directionsText: {
    color: '#00B761',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#AAA',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 24,
  },
  filterField: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: '#0D1B2A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  applyButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
