import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ActiveBookingItem = ({ id, customer, service, amount, status, avatar, onPress }: any) => (
  <TouchableOpacity style={styles.bookingRow} onPress={onPress}>
    <View style={styles.customerCell}>
      <Image source={{ uri: avatar }} style={styles.tinyAvatar} />
      <Text style={styles.customerName}>{customer}</Text>
    </View>
    <Text style={styles.serviceCell} numberOfLines={1}>{service}</Text>
    <Text style={styles.amountCell}>₱{amount}</Text>
    <View style={[styles.statusPill, status === 'Confirmed' ? styles.statusConfirmed : status === 'Pending' ? styles.statusPending : styles.statusInProgress]}>
      <Text style={[styles.statusText, status === 'Confirmed' ? styles.textConfirmed : status === 'Pending' ? styles.textPending : styles.textInProgress]}>
        {status}
      </Text>
    </View>
  </TouchableOpacity>
);

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const UpcomingBooking = ({ id, date, time, customer, service, location, status, onPress }: any) => (
  <View style={styles.upcomingCard}>
    <View style={styles.upcomingHeader}>
      <Text style={styles.upcomingDateTime}>{date} at {time}</Text>
      <View style={[styles.statusPillSmall, status === 'Confirmed' ? styles.statusConfirmed : styles.statusPending]}>
        <Text style={[styles.statusTextSmall, status === 'Confirmed' ? styles.textConfirmed : styles.textPending]}>{status}</Text>
      </View>
    </View>
    <Text style={styles.upcomingCustomer}>{customer}</Text>
    <Text style={styles.upcomingService}>{service}</Text>
    <View style={styles.locationRow}>
      <Ionicons name="location-outline" size={14} color="#777" />
      <Text style={styles.upcomingLocation}>{location}</Text>
    </View>
    <TouchableOpacity style={styles.viewDetailsButton} onPress={onPress}>
      <Text style={styles.viewDetailsText}>View Details</Text>
    </TouchableOpacity>
  </View>
);

const MetricItem = ({ label, value, progress }: any) => (
  <View style={styles.metricRow}>
    <View style={styles.metricLabelRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: progress }]} />
    </View>
  </View>
);

export default function ProviderDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.providerName}>Service Provider</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <TouchableOpacity 
              style={styles.walletIconContainer}
              onPress={() => router.push('/provider-earnings' as any)}
            >
              <Ionicons name="wallet-outline" size={20} color="#00B761" />
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>₱24,850.00</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color="#00B761" />
            <Text style={styles.trendText}>+12.5% from last month</Text>
          </View>
        </View>

        {/* Today's Jobs Card - Standalone */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/provider-calendar' as any)}
          >
            <Text style={styles.statLabel}>Today's{"\n"}Jobs</Text>
            <Text style={styles.statValue}>3</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Card - Standalone */}
        <TouchableOpacity 
          style={styles.ratingCardFull}
          onPress={() => router.push('/ratings' as any)}
        >
          <View>
            <Text style={styles.statLabel}>Rating</Text>
            <View style={styles.ratingBox}>
              <Text style={styles.statValue}>4.9</Text>
              <Ionicons name="star" size={18} color="#FFD700" style={{ marginLeft: 4 }} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>

        {/* Booking Alert */}
        <TouchableOpacity 
          style={styles.bookingAlert} 
          onPress={() => router.push('/provider-bookings' as any)}
        >
          <View style={styles.alertLeft}>
            <Text style={styles.alertTitle}>1 New Booking Request</Text>
            <Text style={styles.alertSubtitle}>Tap to review and accept</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Active Bookings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/provider-bookings' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 1.2 }]}>Customer</Text>
            <Text style={[styles.headerText, { flex: 1.5 }]}>Service</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Amount</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Status</Text>
          </View>
          
          <ActiveBookingItem 
            id="BK-2026-03-001"
            customer="Juan" 
            service="Plumbing Rep.." 
            amount="1,500.00" 
            status="Confirmed" 
            avatar="https://i.pravatar.cc/100?u=juan"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-001' } } as any)}
          />
          <ActiveBookingItem 
            id="BK-2026-03-002"
            customer="Maria" 
            service="Electrical Wir.." 
            amount="2,300.00" 
            status="Pending" 
            avatar="https://i.pravatar.cc/100?u=maria"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-002' } } as any)}
          />
          <ActiveBookingItem 
            id="BK-2026-03-003"
            customer="Pedro" 
            service="Aircon Clean.." 
            amount="800.00" 
            status="Confirmed" 
            avatar="https://i.pravatar.cc/100?u=pedro"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-003' } } as any)}
          />
          <ActiveBookingItem 
            id="BK-2026-03-004"
            customer="Ana" 
            service="Home Cleani.." 
            amount="1,200.00" 
            status="In Progress" 
            avatar="https://i.pravatar.cc/100?u=ana"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-004' } } as any)}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitlePadding}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction 
            icon="time-outline" 
            label="Set Availability" 
            color="#00B761" 
            onPress={() => router.push('/provider-availability' as any)}
          />
          <QuickAction 
            icon="calendar-outline" 
            label="View Calendar" 
            color="#00B761" 
            onPress={() => router.push('/provider-calendar' as any)}
          />
          <QuickAction 
            icon="cash-outline" 
            label="Update Pricing" 
            color="#00B761" 
            onPress={() => router.push('/pricing' as any)}
          />
          <QuickAction 
            icon="trending-up-outline" 
            label="View Earnings" 
            color="#00B761" 
            onPress={() => router.push('/provider-earnings' as any)}
          />
        </View>

        {/* Upcoming Bookings */}
        <Text style={styles.sectionTitlePadding}>Upcoming Bookings</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <UpcomingBooking 
            id="BK-2026-03-001"
            date="March 15, 2026" 
            time="2:00 PM" 
            customer="Juan Dela Cruz" 
            service="Plumbing Repair" 
            location="123 Rizal Street, Makati City" 
            status="Confirmed"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-001' } } as any)}
          />
          <UpcomingBooking 
            id="BK-2026-03-002"
            date="March 16, 2026" 
            time="10:00 AM" 
            customer="Maria Santos" 
            service="Electrical Wiring" 
            location="456 Bonifacio Ave, Taguig" 
            status="Pending"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-002' } } as any)}
          />
          <UpcomingBooking 
            id="BK-2026-03-003"
            date="March 18, 2026" 
            time="3:30 PM" 
            customer="Pedro Reyes" 
            service="Aircon Cleaning" 
            location="789 Luna Street, Quezon City" 
            status="Confirmed"
            onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-003' } } as any)}
          />
        </ScrollView>

        {/* Performance Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <TouchableOpacity onPress={() => router.push('/metrics' as any)}>
            <Text style={styles.viewAllText}>Analysis</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.metricsContainer} 
          activeOpacity={0.7}
          onPress={() => router.push('/metrics' as any)}
        >
          <MetricItem label="Acceptance Rate" value="92%" progress="92%" />
          <MetricItem label="Completion Rate" value="98%" progress="98%" />
          <MetricItem label="Response Time" value="< 5 min" progress="85%" />
        </TouchableOpacity>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#00B761',
    paddingBottom: 80,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E8FBF2',
    fontFamily: 'Outfit-Regular',
  },
  providerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: 'Outfit-Bold',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6F61',
    borderWidth: 1.5,
    borderColor: '#00B761',
  },
  scrollContainer: {
    flex: 1,
    marginTop: -60,
  },
  earningsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
  },
  walletIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#00B761',
    marginBottom: 8,
    fontFamily: 'Outfit-Bold',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#00B761',
    fontWeight: '700',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
    lineHeight: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingCardFull: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bookingAlert: {
    backgroundColor: '#00B761',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLeft: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#E8FBF2',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  sectionTitlePadding: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    paddingHorizontal: 24,
    marginTop: 30,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '700',
  },
  tableContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8FBF2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777',
    textTransform: 'uppercase',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  customerCell: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tinyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  serviceCell: {
    flex: 1.5,
    fontSize: 11,
    color: '#444',
  },
  amountCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#00B761',
  },
  statusPill: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusConfirmed: {
    backgroundColor: '#E8FBF2',
  },
  statusPending: {
    backgroundColor: '#FFF2E6',
  },
  statusInProgress: {
    backgroundColor: '#E6F0FF',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textConfirmed: {
    color: '#00B761',
  },
  textPending: {
    color: '#FF8800',
  },
  textInProgress: {
    color: '#0066FF',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 12,
  },
  actionCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  horizontalScroll: {
    paddingLeft: 24,
    paddingRight: 12,
    paddingBottom: 20,
  },
  upcomingCard: {
    width: width * 0.75,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upcomingDateTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B761',
  },
  statusPillSmall: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '800',
  },
  upcomingCustomer: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  upcomingService: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  upcomingLocation: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
  },
  viewDetailsButton: {
    backgroundColor: '#F8F9FA',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  metricsContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  metricRow: {
    marginBottom: 20,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    color: '#00B761',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00B761',
    borderRadius: 3,
  },
  footerSpacer: {
    height: 40,
  },
});
