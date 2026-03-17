import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
// Import data from bookings file
import { BOOKINGS_DATA } from './provider-bookings';

const { width } = Dimensions.get('window');

const StatusStep = ({ icon, label, completed, active }: { icon: string, label: string, completed: boolean, active: boolean }) => (
  <View style={styles.statusStep}>
    <View style={styles.stepIconContainer}>
      <View style={[styles.stepLine, completed && styles.completedLine]} />
      <View style={[
        styles.stepCircle, 
        completed && styles.completedCircle,
        active && styles.activeCircle
      ]}>
        <Ionicons 
          name={icon as any} 
          size={16} 
          color={completed || active ? '#FFF' : '#AAA'} 
        />
      </View>
    </View>
    <Text style={[styles.stepLabel, active && styles.activeStepLabel]}>{label}</Text>
  </View>
);

export default function ProviderBookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Find the booking or default to a safe mock
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  // Derive status details
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';
  const isInProgress = booking.status === 'In Progress';

  // Derived fee calculation
  const amountNum = parseFloat(booking.amount.replace(/,/g, ''));
  const platformFee = Math.round(amountNum * 0.1);
  const earnings = amountNum - platformFee;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.bookingId}>{booking.id}</Text>
          
          <View style={[
            styles.statusBadge, 
            isConfirmed && styles.confirmedBadge,
            isPending && styles.pendingBadge,
            isInProgress && styles.inProgressBadge
          ]}>
            <Text style={[
              styles.statusBadgeText,
              isConfirmed && styles.confirmedText,
              isPending && styles.pendingText,
              isInProgress && styles.inProgressText
            ]}>
              {booking.status === 'Pending' ? 'Pending Confirmation' : booking.status}
            </Text>
          </View>

          {/* Timeline - Show if not cancelled */}
          <View style={styles.timelineContainer}>
            <StatusStep icon="checkmark" label="Confirmed" completed={isConfirmed || isInProgress} active={isConfirmed} />
            <StatusStep icon="navigate" label="On the Way" completed={isInProgress} active={false} />
            <StatusStep icon="location" label="Arrived" completed={isInProgress} active={false} />
            <StatusStep icon="play" label="In Progress" completed={false} active={isInProgress} />
            <StatusStep icon="checkmark-done" label="Completed" completed={false} active={false} />
          </View>

          {/* Customer Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Customer</Text>
            <View style={styles.customerRow}>
              <Image 
                source={{ uri: booking.avatar }} 
                style={styles.customerAvatar} 
              />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{booking.customer}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.ratingText}>4.6 <Text style={styles.reviewCount}>(18 reviews)</Text></Text>
                </View>
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color="#777" />
                  <Text style={styles.phoneText}>*** **** **89</Text>
                </View>
              </View>
            </View>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={18} color="#FFF" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => router.push('/provider-messages' as any)}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#00B761" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Service Details</Text>
            <Text style={styles.serviceName}>{booking.service}</Text>
            
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#777" />
              <Text style={styles.detailText}>{booking.date} at {booking.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={18} color="#777" />
              <Text style={styles.detailText}>Est. Duration: 3 hours</Text>
            </View>

            {/* Map Placeholder */}
            <View style={styles.mapContainer}>
              <Ionicons name="location" size={40} color="#CCC" />
              <Text style={styles.mapText}>Location Map</Text>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#777" />
              <Text style={styles.addressText}>{booking.address}, Brgy. Fort Bonifacio, Taguig City, Metro Manila</Text>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.subLabel}>Description</Text>
              <Text style={styles.descriptionText}>
                Need to install additional outlets in the living room and bedroom. Also check the circuit breaker.
              </Text>
            </View>

            <View style={styles.specialInstructions}>
              <Text style={styles.instructionLabel}>Special Instructions</Text>
              <Text style={styles.instructionText}>Please bring extension cords. Building security requires ID.</Text>
            </View>

            <View style={styles.photosSection}>
              <Text style={styles.subLabel}>Photos</Text>
              <View style={styles.photoRow}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop' }} 
                  style={styles.jobPhoto} 
                />
              </View>
            </View>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Pricing Breakdown</Text>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Service Fee</Text>
              <Text style={styles.financeValue}>₱{booking.amount}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Additional Charges</Text>
              <Text style={styles.financeValue}>₱0</Text>
            </View>
            <View style={[styles.financeRow, { marginTop: 12 }]}>
              <Text style={styles.financeLabel}>Platform Fee (10%)</Text>
              <Text style={styles.feeValue}>-₱{platformFee.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsValue}>₱{earnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            {isConfirmed && (
              <TouchableOpacity 
                style={styles.startTripButton}
                onPress={() => router.push({ pathname: '/provider-navigation', params: { id: booking.id } } as any)}
              >
                <Ionicons name="navigate" size={20} color="#FFF" />
                <Text style={styles.startTripText}>Start Trip</Text>
              </TouchableOpacity>
            )}

            {isInProgress && (
              <TouchableOpacity 
                style={styles.startTripButton}
                onPress={() => router.push('/provider-service-in-progress' as any)}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.startTripText}>Continue Service</Text>
              </TouchableOpacity>
            )}

            {isPending && (
              <TouchableOpacity style={styles.startTripButton}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.startTripText}>Confirm Booking</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButtonOutline}
              onPress={() => router.push('/provider-additional-charges' as any)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#00B761" />
              <Text style={styles.actionButtonTextOutline}>Add Additional Charges</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButtonLight}
              onPress={() => router.push('/provider-reschedule' as any)}
            >
              <Ionicons name="calendar-outline" size={18} color="#555" />
              <Text style={styles.actionButtonTextLight}>Request Reschedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButtonDanger}>
              <Text style={styles.actionButtonTextDanger}>Cancel Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButtonLight}>
              <Ionicons name="alert-circle-outline" size={18} color="#555" />
              <Text style={styles.actionButtonTextLight}>Report Issue</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  bookingId: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  confirmedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  confirmedText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 15,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusBadgeText: {
    fontWeight: '700',
    fontSize: 15,
  },
  pendingBadge: {
    backgroundColor: '#FFF9E6',
  },
  pendingText: {
    color: '#FFB800',
  },
  inProgressBadge: {
    backgroundColor: '#EBF5FF',
  },
  inProgressText: {
    color: '#007AFF',
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  statusStep: {
    alignItems: 'center',
    width: (width - 48) / 5,
  },
  stepIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    width: width / 5,
    height: 2,
    backgroundColor: '#F0F0F0',
    zIndex: -1,
  },
  completedLine: {
    backgroundColor: '#00B761',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  completedCircle: {
    backgroundColor: '#00B761',
  },
  activeCircle: {
    backgroundColor: '#00B761',
    borderWidth: 4,
    borderColor: '#E8FBF2',
  },
  stepLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#0D1B2A',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 4,
  },
  reviewCount: {
    fontWeight: '400',
    color: '#8E8E93',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 6,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#00B761',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  callButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 15,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 12,
    fontWeight: '500',
  },
  mapContainer: {
    height: 160,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    marginTop: 8,
    color: '#8E8E93',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    lineHeight: 20,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  specialInstructions: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B6E12',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#8B6E12',
    lineHeight: 20,
  },
  photosSection: {
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  jobPhoto: {
    width: (width - 100) / 2,
    height: 120,
    borderRadius: 16,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  financeLabel: {
    fontSize: 14,
    color: '#555',
  },
  financeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4D4D',
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00B761',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B761',
  },
  actionsFooter: {
    gap: 12,
    marginTop: 12,
  },
  startTripButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startTripText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonOutline: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonTextOutline: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 15,
  },
  actionButtonLight: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonTextLight: {
    color: '#0D1B2A',
    fontWeight: '700',
    fontSize: 15,
  },
  actionButtonDanger: {
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonTextDanger: {
    color: '#FF4D4D',
    fontWeight: '700',
    fontSize: 15,
  },
  footerSpacer: {
    height: 48,
  },
});
