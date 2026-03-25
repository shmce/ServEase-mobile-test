import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TimePickerModal } from '../components/TimePickerModal';
import { DatePickerModal } from '../components/DatePickerModal';

const { width } = Dimensions.get('window');

const RESCHEDULE_REASONS = [
  'Schedule Conflict',
  'Emergency',
  'Location Issues',
  'Equipment Failure',
  'Weather Conditions',
  'Other',
];

export default function ProviderRescheduleScreen() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showReasons, setShowReasons] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const bookingDetails = {
    service: 'Plumbing Repair',
    customer: 'Juan Dela Cruz',
    date: 'March 15, 2026',
    time: '2:00 PM',
    address: '123 Rizal Street, Brgy. Poblacion, Makati City',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reschedule Request</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Current Booking Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Current Booking Details</Text>
              <Text style={styles.serviceName}>{bookingDetails.service}</Text>
              <Text style={styles.customerName}>Customer: {bookingDetails.customer}</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#777" />
                <Text style={styles.detailText}>{bookingDetails.date} at {bookingDetails.time}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#777" />
                <Text style={styles.detailText}>{bookingDetails.address}</Text>
              </View>
            </View>

            {/* Form Sections */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Reason for Reschedule</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setShowReasons(!showReasons)}
              >
                <Text style={[styles.pickerText, !reason && styles.placeholderText]}>
                  {reason || 'Select a reason'}
                </Text>
                <Ionicons name={showReasons ? "chevron-up" : "chevron-down"} size={20} color="#AAA" />
              </TouchableOpacity>
              
              {showReasons && (
                <View style={styles.reasonsList}>
                  {RESCHEDULE_REASONS.map((r) => (
                    <TouchableOpacity 
                      key={r} 
                      style={styles.reasonItem}
                      onPress={() => {
                        setReason(r);
                        setShowReasons(false);
                      }}
                    >
                      <Text style={[styles.reasonText, reason === r && styles.selectedReasonText]}>{r}</Text>
                      {reason === r && <Ionicons name="checkmark" size={18} color="#00B761" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Proposed New Date</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => {
                  Keyboard.dismiss();
                  setDatePickerVisible(true);
                }}
              >
                <Text style={[styles.pickerText, !date && styles.placeholderText]}>
                  {date || 'dd/mm/yyyy'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#EEE" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Proposed New Time</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => {
                  Keyboard.dismiss();
                  setPickerVisible(true);
                }}
              >
                <Text style={[styles.pickerText, !time && styles.placeholderText]}>
                  {time || 'Select a time'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.formLabel}>Explanation</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Explain the situation to the customer..."
                placeholderTextColor="#AAA"
                value={explanation}
                onChangeText={setExplanation}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Informative Alerts */}
            <View style={styles.blueAlert}>
              <Ionicons name="information-circle-outline" size={20} color="#2D5B7A" />
              <Text style={styles.blueAlertText}>
                Customer must approve this reschedule request
              </Text>
            </View>

            <View style={styles.warningAlert}>
              <Ionicons name="warning-outline" size={20} color="#8B6E12" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Impact on Rating</Text>
                <Text style={styles.warningDescription}>
                  Rescheduling may affect your reliability score and customer satisfaction rating
                </Text>
              </View>
            </View>

          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, (!reason || !date || !explanation) && styles.submitButtonDisabled]}
            disabled={!reason || !date || !explanation}
            onPress={() => {
              Keyboard.dismiss();
              Alert.alert('Success', 'Reschedule request sent to customer.');
              if (router.canGoBack?.()) router.back(); else router.replace('/' as any);
            }}
          >
            <Text style={styles.submitButtonText}>Send Reschedule Request</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <TimePickerModal
        key="reschedule-time-picker"
        visible={isPickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={(val) => setTime(val)}
        initialTime={time || '02:00 PM'}
        title="Select Proposed Time"
      />

      <DatePickerModal
        key="reschedule-date-picker"
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(val) => setDate(val)}
        initialDate={date}
        title="Select Proposed Date"
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
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    marginLeft: 8,
    fontWeight: '500',
  },
  formGroup: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requiredAsterisk: {
    color: '#FF4D4D',
    fontSize: 16,
    marginLeft: 4,
    marginTop: -4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 15,
    color: '#0D1B2A',
  },
  placeholderText: {
    color: '#AAA',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  textInput: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#0D1B2A',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  reasonsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginTop: 8,
    padding: 4,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#444',
  },
  selectedReasonText: {
    color: '#00B761',
    fontWeight: '600',
  },
  blueAlert: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D5B7A' + '20',
  },
  blueAlertText: {
    flex: 1,
    fontSize: 13,
    color: '#2D5B7A',
    fontWeight: '700',
  },
  warningAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#8B6E12' + '20',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    color: '#8B6E12',
    fontWeight: '700',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 12,
    color: '#8B6E12',
    lineHeight: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#99E6C3',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

