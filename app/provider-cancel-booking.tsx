import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Dimensions, KeyboardAvoidingView, Platform, Modal, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOOKINGS_DATA } from './provider-bookings';

const { width, height } = Dimensions.get('window');

const CANCELLATION_REASONS = [
  'Medical Emergency',
  'Transportation Issues',
  'Double Booking',
  'Tool/Equipment Breakdown',
  'Family Emergency',
  'Inclement Weather',
  'Safety Concerns at Location',
  'Other Reasons'
];

export default function ProviderCancelBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showReasonsModal, setShowReasonsModal] = useState(false);
  
  // Find the booking or default to a safe mock
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  const handleSelectReason = (selectedReason: string) => {
    setReason(selectedReason);
    setShowReasonsModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Booking</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Booking Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Booking Details</Text>
            <Text style={styles.serviceName}>{booking.service}</Text>
            <Text style={styles.customerName}>Customer: {booking.customer}</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#00B761" />
              <Text style={styles.detailText}>{booking.date} at {booking.time}</Text>
            </View>
            
            <Text style={styles.addressText}>{booking.address}, Brgy. Poblacion, Makati City</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Booking Amount</Text>
              <Text style={styles.amountValue}>₱{booking.amount}</Text>
            </View>
          </View>

          {/* Cancellation Policy */}
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Cancellation Policy</Text>
            <View style={styles.policyItem}>
              <View style={styles.bullet} />
              <Text style={styles.policyText}>Time until booking: 8 hours</Text>
            </View>
            <View style={styles.policyItem}>
              <View style={styles.bullet} />
              <Text style={styles.policyText}>Cancellation penalty: ₱250</Text>
            </View>
            <View style={styles.policyItem}>
              <View style={styles.bullet} />
              <Text style={styles.policyText}>Impact on rating: May receive negative review</Text>
            </View>
          </View>

          {/* Cancellation Reason */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Cancellation Reason <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowReasonsModal(true)}
            >
              <Text style={[styles.pickerText, reason ? styles.pickerTextSelected : null]}>
                {reason || 'Select a reason'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Detailed Explanation */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Detailed Explanation <Text style={styles.required}>*</Text></Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Please provide details about why you need to cancel..."
                placeholderTextColor="#AAA"
                multiline
                numberOfLines={6}
                value={explanation}
                onChangeText={setExplanation}
              />
            </View>
          </View>

          {/* Warning Message */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#FF6F61" />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Warning</Text>
              <Text style={styles.warningText}>High cancellation rate affects your account standing and may result in suspension</Text>
            </View>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, (!reason || !explanation) && styles.confirmButtonDisabled]}
          onPress={() => router.back()}
          disabled={!reason || !explanation}
        >
          <Ionicons name="close-circle-outline" size={24} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.confirmButtonText}>Confirm Cancellation</Text>
        </TouchableOpacity>
      </View>

      {/* Reasons Modal */}
      <Modal
        visible={showReasonsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowReasonsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Reason</Text>
              <TouchableOpacity onPress={() => setShowReasonsModal(false)}>
                <Ionicons name="close" size={24} color="#0D1B2A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CANCELLATION_REASONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.reasonItem}
                  onPress={() => handleSelectReason(item)}
                >
                  <Text style={[styles.reasonText, reason === item && styles.reasonTextActive]}>{item}</Text>
                  {reason === item && <Ionicons name="checkmark-circle" size={20} color="#00B761" />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </View>
        </Pressable>
      </Modal>
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
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardLabel: {
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
    color: '#555',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#0D1B2A',
    fontWeight: '800',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  policyCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginRight: 10,
  },
  policyText: {
    fontSize: 13,
    color: '#92400E',
  },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  required: {
    color: '#FF6F61',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  pickerText: {
    fontSize: 14,
    color: '#AAA',
  },
  textAreaWrapper: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  textArea: {
    fontSize: 14,
    color: '#0D1B2A',
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFA39E',
    marginTop: 8,
  },
  warningTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6F61',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#9E1111',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#FF6F61', // Corrected to design red
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#FFBDBC',
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerTextSelected: {
    color: '#0D1B2A',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  reasonText: {
    fontSize: 15,
    color: '#444',
  },
  reasonTextActive: {
    color: '#00B761',
    fontWeight: '700',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  spacer: {
    height: 40,
  },
});
