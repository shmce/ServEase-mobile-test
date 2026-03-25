import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PreferenceItem = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (val: boolean) => void }) => (
  <View style={styles.preferenceItem}>
    <Text style={styles.preferenceLabel}>{label}</Text>
    <Switch 
      value={value} 
      onValueChange={onValueChange}
      trackColor={{ false: '#E0E0E0', true: '#00B761' }}
      thumbColor={Platform.OS === 'ios' ? '#FFF' : value ? '#FFF' : '#F4F3F4'}
    />
  </View>
);

const SectionHeader = ({ icon, title, color = '#E8FBF2', iconColor = '#00B761' }: any) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export default function ProviderNotificationPreferencesScreen() {
  const router = useRouter();
  
  // Booking Notifications
  const [newBooking, setNewBooking] = useState(true);
  const [bookingConfirmation, setBookingConfirmation] = useState(true);
  const [bookingCancellation, setBookingCancellation] = useState(true);
  const [bookingModification, setBookingModification] = useState(true);
  const [customerMessages, setCustomerMessages] = useState(true);
  
  // Payment Notifications
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [payoutProcessed, setPayoutProcessed] = useState(true);
  
  // Other Alerts
  const [promotionalOffers, setPromotionalOffers] = useState(false);
  const [platformUpdates, setPlatformUpdates] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Booking Notifications */}
        <SectionHeader icon="notifications-outline" title="Booking Notifications" />
        <View style={styles.section}>
          <PreferenceItem label="New Booking Requests" value={newBooking} onValueChange={setNewBooking} />
          <View style={styles.separator} />
          <PreferenceItem label="Booking Confirmations" value={bookingConfirmation} onValueChange={setBookingConfirmation} />
          <View style={styles.separator} />
          <PreferenceItem label="Booking Cancellations" value={bookingCancellation} onValueChange={setBookingCancellation} />
          <View style={styles.separator} />
          <PreferenceItem label="Booking Modifications" value={bookingModification} onValueChange={setBookingModification} />
          <View style={styles.separator} />
          <PreferenceItem label="Customer Messages" value={customerMessages} onValueChange={setCustomerMessages} />
        </View>

        {/* Payment Notifications */}
        <SectionHeader icon="cash-outline" title="Payment Notifications" />
        <View style={styles.section}>
          <PreferenceItem label="Payment Received" value={paymentReceived} onValueChange={setPaymentReceived} />
          <View style={styles.separator} />
          <PreferenceItem label="Payout Processed" value={payoutProcessed} onValueChange={setPayoutProcessed} />
        </View>

        {/* Other Alerts */}
        <SectionHeader icon="information-circle-outline" title="Other Alerts" />
        <View style={styles.section}>
          <PreferenceItem label="Promotional Offers" value={promotionalOffers} onValueChange={setPromotionalOffers} />
          <View style={styles.separator} />
          <PreferenceItem label="Platform Updates" value={platformUpdates} onValueChange={setPlatformUpdates} />
          <View style={styles.separator} />
          <PreferenceItem label="Daily Summary" value={dailySummary} onValueChange={setDailySummary} />
        </View>

        {/* Notification Timing */}
        <SectionHeader icon="time-outline" title="Notification Timing" />
        <View style={styles.section}>
          <Text style={styles.timingLabel}>Preferred Notification Time (Daily Summary)</Text>
          <TouchableOpacity style={styles.pickerButton}>
            <Text style={styles.pickerText}>08:00 AM</Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacer} />
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  preferenceLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F8F9FA',
  },
  timingLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pickerText: {
    fontSize: 15,
    color: '#0D1B2A',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2E7D32', // Darker green matching mockup button
    marginHorizontal: 16,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 40,
  },
});

