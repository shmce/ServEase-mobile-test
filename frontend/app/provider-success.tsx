import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchProviderBookingView, ProviderBookingView } from '@/lib/provider-booking';

const { width } = Dimensions.get('window');

export default function ProviderSuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<ProviderBookingView | null>(null);

  useEffect(() => {
    fetchProviderBookingView(id).then(setBooking).catch(() => setBooking(null));
  }, [id]);

  if (!booking) {
    return null;
  }

  const baseAmount = parseFloat(booking.amount.replace(/,/g, ''));
  const additionalCharges = 500; // Mock additional charges
  const totalCharged = baseAmount + additionalCharges;
  const platformFee = totalCharged * 0.1;
  const finalEarnings = totalCharged - platformFee;

  const earnings = {
    totalCharged,
    platformFee,
    finalEarnings,
    payoutDate: 'March 18, 2026',
  };

  const serviceSummary = {
    customer: booking.customer,
    serviceType: booking.service,
    date: booking.date,
    duration: '2h 45m',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Hero Success Section */}
          <View style={styles.heroSection}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={100} color="#00B761" />
            </View>
            <Text style={styles.heroTitle}>Service Completed!</Text>
            <Text style={styles.heroSubtitle}>
              Great job! Your service has been marked as complete.
            </Text>
          </View>

          {/* Service Summary Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.labelSmall}>Service Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{serviceSummary.customer}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Service Type</Text>
                <Text style={styles.summaryValue}>{serviceSummary.serviceType}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{serviceSummary.date}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{serviceSummary.duration}</Text>
              </View>
            </View>
          </View>

          {/* Earnings Breakdown Card */}
          <View style={styles.earningsCard}>
            <Text style={styles.labelSmall}>Earnings Breakdown</Text>
            
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Total Charged</Text>
              <Text style={styles.earningsValue}>₱{earnings.totalCharged.toLocaleString()}</Text>
            </View>
            
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Platform Fee (10%)</Text>
              <Text style={styles.feeValue}>-₱{earnings.platformFee.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.earningsRow}>
              <Text style={styles.totalEarningsLabel}>Your Earnings (90%)</Text>
              <Text style={styles.totalEarningsValue}>₱{earnings.finalEarnings.toLocaleString()}</Text>
            </View>

            <View style={styles.payoutBadge}>
              <Text style={styles.payoutText}>Estimated Payout Date: <Text style={styles.payoutDate}>{earnings.payoutDate}</Text></Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.primaryAction}>
              <Ionicons name="star" size={20} color="#FFF" />
              <Text style={styles.primaryActionText}>Ask Customer for Review</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => router.push({ pathname: '/provider-receipt', params: { id: booking.id } } as any)}
            >
              <Ionicons name="document-text-outline" size={20} color="#00B761" />
              <Text style={styles.secondaryActionText}>View Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => router.push('/provider-bookings' as any)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
              <Ionicons name="arrow-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

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
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FBF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  labelSmall: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  earningsCard: {
    backgroundColor: '#F7FFF9',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#00B761',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  feeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4D4D',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,183,97,0.1)',
    marginVertical: 16,
  },
  totalEarningsLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B761',
  },
  totalEarningsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B761',
  },
  payoutBadge: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,183,97,0.1)',
  },
  payoutText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  payoutDate: {
    fontWeight: '700',
    color: '#0D1B2A',
  },
  actionsContainer: {
    gap: 16,
  },
  primaryAction: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#00B761',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  secondaryActionText: {
    color: '#00B761',
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  doneButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '700',
  },
});
