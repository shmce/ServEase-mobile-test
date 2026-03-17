import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, FlatList, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const TABS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'] as const;
type Tab = typeof TABS[number];

export const BOOKINGS_DATA = [
  {
    id: 'BK-2026-03-001',
    customer: 'Juan Dela Cruz',
    service: 'Plumbing Repair',
    date: 'March 15, 2026',
    time: '2:00 PM',
    address: '123 Rizal Street, Makati City',
    distance: '2.3 km away',
    amount: '1,500.00',
    status: 'Confirmed',
    avatar: 'https://i.pravatar.cc/100?u=juan',
    tab: 'Upcoming' as Tab,
    duration: '2 hours',
    description: 'Kitchen sink is leaking badly. Water is dripping from the pipe underneath. Need urgent repair.',
  },
  {
    id: 'BK-2026-03-002',
    customer: 'Maria Santos',
    service: 'Electrical Wiring',
    date: 'March 16, 2026',
    time: '10:00 AM',
    address: '456 Bonifacio Ave, Taguig',
    distance: '5.1 km away',
    amount: '2,300.00',
    status: 'Pending',
    avatar: 'https://i.pravatar.cc/100?u=maria',
    tab: 'Upcoming' as Tab,
    duration: '3 hours',
    description: 'Need to install additional outlets in the living room and bedroom. Also check the circuit breaker.',
  },
  {
    id: 'BK-2026-03-003',
    customer: 'Pedro Reyes',
    service: 'Aircon Cleaning',
    date: 'March 18, 2026',
    time: '3:30 PM',
    address: '789 Luna Street, Quezon City',
    distance: '7.8 km away',
    amount: '800.00',
    status: 'Confirmed',
    avatar: 'https://i.pravatar.cc/100?u=pedro',
    tab: 'Upcoming' as Tab,
    duration: '1.5 hours',
    description: 'Standard aircon cleaning for a split-type unit. Unit is in the living room.',
  },
  {
    id: 'BK-2026-03-004',
    customer: 'Ana Garcia',
    service: 'Home Cleaning',
    date: 'March 13, 2026',
    time: '9:00 AM',
    address: '321 Magallanes Street, Manila',
    distance: '3.5 km away',
    amount: '1,200.00',
    status: 'In Progress',
    avatar: 'https://i.pravatar.cc/100?u=ana',
    tab: 'In Progress' as Tab,
    duration: '4 hours',
    description: 'Deep house cleaning inclusive of windows and kitchen cabinets.',
  },
];

const BookingCard = ({ item }: { item: typeof BOOKINGS_DATA[0] }) => {
  const router = useRouter();
  
  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>{item.id}</Text>
        <View style={[
          styles.statusBadge, 
          item.status === 'Confirmed' ? styles.confirmedBadge : 
          item.status === 'In Progress' ? styles.inProgressBadge :
          styles.pendingBadge
        ]}>
          <Text style={[
            styles.statusText, 
            item.status === 'Confirmed' ? styles.confirmedText : 
            item.status === 'In Progress' ? styles.inProgressText :
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
          <Text style={styles.detailText}>
            {item.address} <Text style={styles.distanceText}>({item.distance})</Text>
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
          {item.status === 'Pending' ? (
            <>
              <TouchableOpacity style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewDetailsButtonOutline}
                onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: item.id } } as any)}
              >
                <Text style={styles.viewDetailsTextOutline}>View Details</Text>
              </TouchableOpacity>
            </>
          ) : item.status === 'In Progress' ? (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => router.push('/provider-service-in-progress' as any)}
            >
              <Text style={styles.continueButtonText}>Continue Service</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: item.id } } as any)}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.directionsButton}>
                <Ionicons name="navigate-outline" size={16} color="#00B761" />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterServiceType('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(provider-tabs)/' as any)} style={styles.backButton}>
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
              {tab === 'Upcoming' && <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>}
              {tab === 'In Progress' && <View style={[styles.badge, styles.greyBadge]}><Text style={styles.badgeText}>1</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search & Filter */}
      <View style={styles.controlsRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#AAA" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={20} color="#555" />
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowFilterModal(false)}
          >
            <Pressable style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter Bookings</Text>
              
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Date From</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#AAA"
                    value={dateFrom}
                    onChangeText={setDateFrom}
                  />
                  <Ionicons name="calendar-outline" size={18} color="#AAA" />
                </View>
              </View>

              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Date To</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#AAA"
                    value={dateTo}
                    onChangeText={setDateTo}
                  />
                  <Ionicons name="calendar-outline" size={18} color="#AAA" />
                </View>
              </View>

              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Service Type</Text>
                <View style={[styles.inputWrapper, { paddingRight: 0 }]}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Plumbing, Electrical"
                    placeholderTextColor="#AAA"
                    value={filterServiceType}
                    onChangeText={setFilterServiceType}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <FlatList
        data={BOOKINGS_DATA.filter(item => 
          item.tab === activeTab &&
          (item.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (filterServiceType === '' || item.service.toLowerCase().includes(filterServiceType.toLowerCase()))
        )}
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
