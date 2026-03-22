import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const BookingDetailsScreen = () => {
  const router = useRouter();
  useLocalSearchParams();

  // Mock data for the specific booking
  const booking = {
    id: 'BK-2026-03-011',
    service: 'Plumbing Repair',
    address: '45 Mabini Ave, Pasig City',
    date: 'March 17',
    year: '2026',
    time: '2:00 PM',
    status: 'Upcoming Service',
    provider: {
      name: 'Juan Dela Cruz',
      rating: 4.9,
      specialty: 'Plumbing Repair',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60',
      isVerified: true,
    },
    totalAmount: '2,200.00',
    countdown: {
      days: '3',
      hours: '4',
      mins: '19',
    }
  };
  const canReviewBooking = booking.status === 'Completed';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.bookingId}>{booking.id}</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Status and Service Title */}
        <View style={styles.serviceInfoSection}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
          <Text style={styles.serviceTitle}>{booking.service}</Text>
          <Text style={styles.serviceAddress}>{booking.address}</Text>
        </View>

        {/* Schedule Cards */}
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleCard}>
            <Ionicons name="calendar" size={24} color="#00C853" />
            <Text style={styles.scheduleDate}>{booking.date}</Text>
            <Text style={styles.scheduleYear}>{booking.year}</Text>
          </View>
          <View style={styles.scheduleCard}>
            <Ionicons name="time" size={24} color="#00C853" />
            <Text style={styles.scheduleTime}>{booking.time}</Text>
            <Text style={styles.scheduleSub}>Scheduled</Text>
          </View>
        </View>

        {/* Countdown Timer */}
        <View style={styles.countdownSection}>
          <Text style={styles.countdownLabel}>SERVICE STARTS IN</Text>
          <View style={styles.timerRow}>
            <View style={styles.timerItem}>
              <View style={styles.timerBox}><Text style={styles.timerNumber}>{booking.countdown.days}</Text></View>
              <Text style={styles.timerLabel}>DAYS</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerItem}>
              <View style={styles.timerBox}><Text style={styles.timerNumber}>{booking.countdown.hours}</Text></View>
              <Text style={styles.timerLabel}>HRS</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerItem}>
              <View style={styles.timerBox}><Text style={styles.timerNumber}>{booking.countdown.mins}</Text></View>
              <Text style={styles.timerLabel}>MINS</Text>
            </View>
          </View>
        </View>

        {/* Provider Assigned Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PROVIDER ASSIGNED</Text>
        </View>
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <View>
              <Image source={{ uri: booking.provider.avatar }} style={styles.providerAvatar} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.providerMainInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>{booking.provider.name}</Text>
                {booking.provider.isVerified && (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={12} color="#00C853" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.providerRatingRow}>
                <Ionicons name="star" size={14} color="#FFA000" />
                <Text style={styles.providerRating}>{booking.provider.rating}</Text>
                <Text style={styles.providerSpecialty}> • {booking.provider.specialty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.providerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={18} color="#0D1B2A" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#0D1B2A" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Details Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BOOKING DETAILS</Text>
        </View>
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Service Address</Text>
              <Text style={styles.detailValue}>{booking.address}</Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₱{booking.totalAmount}</Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {canReviewBooking ? (
            <TouchableOpacity 
              style={[styles.cancelBookingButton, { borderColor: '#00C853', backgroundColor: '#E8FBF2', marginBottom: 15 }]}
              onPress={() => router.push({
                pathname: '/customer-review',
                params: { booking: JSON.stringify(booking) }
              })}
            >
              <Ionicons name="star" size={20} color="#00C853" />
              <Text style={[styles.cancelBookingText, { color: '#00C853' }]}>Leave a Review</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity 
            style={styles.cancelBookingButton}
            onPress={() => router.push('/customer-cancel-booking' as any)}
          >
            <Ionicons name="close" size={20} color="#FF5252" />
            <Text style={styles.cancelBookingText}>Cancel Booking</Text>
          </TouchableOpacity>
          <Text style={styles.policyFootnote}>Free cancellation up to 24 hours before the service</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  bookingId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 25,
  },
  serviceInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#F8FBF9', // Very light green tint
    paddingVertical: 15,
    borderRadius: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008C4A',
  },
  serviceTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  serviceAddress: {
    fontSize: 14,
    color: '#999',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 10,
  },
  scheduleYear: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 10,
  },
  scheduleSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  countdownSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timerItem: {
    alignItems: 'center',
  },
  timerBox: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timerNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00C853',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BABABA',
    marginTop: 8,
  },
  timerSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DDD',
    marginTop: -20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BABABA',
    letterSpacing: 1,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00C853',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMainInfo: {
    flex: 1,
    marginLeft: 15,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1B1E',
    marginLeft: 4,
  },
  providerSpecialty: {
    fontSize: 13,
    color: '#999',
  },
  providerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F5F5F7',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#BABABA',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginTop: 2,
    maxWidth: width * 0.6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00C853',
  },
  bottomActions: {
    alignItems: 'center',
    gap: 15,
  },
  cancelBookingButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFDADA',
    backgroundColor: '#FFF8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5252',
  },
  policyFootnote: {
    fontSize: 12,
    color: '#BABABA',
    textAlign: 'center',
  },
});
