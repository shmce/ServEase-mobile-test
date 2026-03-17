import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOOKINGS_DATA } from './provider-bookings';

const { width } = Dimensions.get('window');

export default function ProviderReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Find the booking or default
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  const baseAmount = parseFloat(booking.amount.replace(/,/g, ''));
  const additionalCharges = 500; // Mock additional charges
  const totalCharged = baseAmount + additionalCharges;
  const platformFee = totalCharged * 0.1;
  const finalEarnings = totalCharged - platformFee;

  const receipt = {
    id: `RCP-${booking.id.replace('BK-', '')}`,
    service: booking.service,
    date: booking.date,
    time: `${booking.time} (${booking.duration})`,
    customer: booking.customer,
    location: booking.address,
    description: booking.description,
    breakdown: {
      serviceCharge: baseAmount,
      replacementParts: additionalCharges,
      emergencyFee: 0,
      subtotal: totalCharged,
      platformFee: platformFee,
      earnings: finalEarnings,
    },
    paymentMethod: 'Digital Payment',
    completedAt: `${booking.date}, ${booking.time}`,
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `ServEase Receipt ${receipt.id} for ${receipt.service}. Total Earnings: ₱${receipt.breakdown.earnings}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Receipt</Text>
        <TouchableOpacity onPress={onShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color="#0D1B2A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Status & ID */}
          <View style={styles.statusSection}>
            <View style={styles.paymentBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#00B761" />
              <Text style={styles.paymentBadgeText}>Payment Received</Text>
            </View>
            <Text style={styles.receiptIdLabel}>Receipt No.</Text>
            <Text style={styles.receiptIdValue}>{receipt.id}</Text>
          </View>

          {/* Hero Service Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroServiceName}>{receipt.service}</Text>
            
            <View style={styles.heroDetailItem}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
              <View style={styles.heroDetailContent}>
                <Text style={styles.heroDetailLabel}>Service Date</Text>
                <Text style={styles.heroDetailValue}>{receipt.date}</Text>
              </View>
            </View>

            <View style={styles.heroDetailItem}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <View style={styles.heroDetailContent}>
                <Text style={styles.heroDetailLabel}>Time & Duration</Text>
                <Text style={styles.heroDetailValue}>{receipt.time}</Text>
              </View>
            </View>

            <View style={styles.heroDetailItem}>
              <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.8)" />
              <View style={styles.heroDetailContent}>
                <Text style={styles.heroDetailLabel}>Customer</Text>
                <Text style={styles.heroDetailValue}>{receipt.customer}</Text>
              </View>
            </View>

            <View style={styles.heroDetailItem}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
              <View style={styles.heroDetailContent}>
                <Text style={styles.heroDetailLabel}>Service Location</Text>
                <Text style={styles.heroDetailValue}>{receipt.location}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Service Description</Text>
            <Text style={styles.descriptionText}>{receipt.description}</Text>
          </View>

          {/* Payment Breakdown Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Payment Breakdown</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Charge</Text>
              <Text style={styles.breakdownValue}>₱{receipt.breakdown.serviceCharge.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Replacement Parts</Text>
              <Text style={styles.breakdownValue}>₱{receipt.breakdown.replacementParts.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Emergency Service Fee</Text>
              <Text style={styles.breakdownValue}>₱{receipt.breakdown.emergencyFee.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>₱{receipt.breakdown.subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.feeLabel}>Platform Fee (10%)</Text>
              <Text style={styles.feeValue}>-₱{receipt.breakdown.platformFee.toLocaleString()}</Text>
            </View>

            <View style={styles.earningsBox}>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsValue}>₱{receipt.breakdown.earnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.sectionCard}>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.sectionLabel}>Payment Method</Text>
                <Text style={styles.metaValue}>{receipt.paymentMethod}</Text>
              </View>
              <View style={styles.metaBadge}>
                <View style={styles.metaBadgeDot} />
                <Text style={styles.metaBadgeText}>Paid</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionLabel}>Completed On</Text>
            <Text style={styles.metaValue}>{receipt.completedAt}</Text>
          </View>

          {/* Download Button */}
          <TouchableOpacity style={styles.downloadButton}>
            <Ionicons name="download-outline" size={20} color="#00B761" />
            <Text style={styles.downloadText}>Download PDF Receipt</Text>
          </TouchableOpacity>

          {/* Legal Footer */}
          <View style={styles.legalFooter}>
            <Text style={styles.legalText}>
              This is a digital receipt issued by ServEase. For any questions or concerns, please contact our support team.
            </Text>
          </View>

          <View style={styles.spacer} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  paymentBadgeText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 14,
  },
  receiptIdLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  receiptIdValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: '#00B761',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroServiceName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  heroDetailContent: {
    flex: 1,
  },
  heroDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroDetailValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    fontWeight: '500',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#0D1B2A',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  subtotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  feeLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4D4D',
  },
  earningsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,183,97,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,183,97,0.3)',
    padding: 16,
    marginTop: 16,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B761',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B761',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  metaBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B761',
  },
  metaBadgeText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00B761',
    gap: 10,
    marginBottom: 24,
  },
  downloadText: {
    color: '#00B761',
    fontWeight: '800',
    fontSize: 15,
  },
  legalFooter: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});
