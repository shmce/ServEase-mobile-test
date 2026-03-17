import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOOKINGS_DATA } from './provider-bookings';

const { width } = Dimensions.get('window');

export default function ProviderCompleteServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Find the booking or default
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  const [checklist, setChecklist] = useState({
    completed: false,
    satisfied: false,
    cleaned: false,
    toolsRemoved: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<'digital' | 'cash'>('digital');
  const [notes, setNotes] = useState('');
  const [caption, setCaption] = useState('');

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllChecked = Object.values(checklist).every(v => v);

  const basePrice = parseFloat(booking.amount.replace(/,/g, ''));
  const additionalCharges = 500; // Mock additional charges
  const total = basePrice + additionalCharges;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Service</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heroTitle}>Service Completed?</Text>

          {/* Duration Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.labelSmall}>Total Service Duration</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationValueRow}>
                <Ionicons name="time-outline" size={24} color="#00B761" />
                <Text style={styles.durationText}>2h 45m</Text>
              </View>
              <View style={styles.estimateBox}>
                <Text style={styles.estimateLabel}>Estimated: 2 hours</Text>
                <Text style={styles.overEstimateText}>45m over estimate</Text>
              </View>
            </View>
          </View>

          {/* Take After Photos */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Take After Photos</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Add caption for photo"
              placeholderTextColor="#AAA"
              value={caption}
              onChangeText={setCaption}
            />
            <TouchableOpacity style={styles.uploadButton}>
              <Ionicons name="camera-outline" size={20} color="#00B761" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Completion Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Service Completion Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe what was done, any issues encountered, recommendations..."
              placeholderTextColor="#AAA"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Quality Checklist */}
          <View style={styles.sectionCard}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionTitle}>Quality Checklist</Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>
            
            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('completed')}>
              <View style={[styles.checkbox, checklist.completed && styles.checkboxActive]}>
                {checklist.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Work completed as agreed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('satisfied')}>
              <View style={[styles.checkbox, checklist.satisfied && styles.checkboxActive]}>
                {checklist.satisfied && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Customer satisfied</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('cleaned')}>
              <View style={[styles.checkbox, checklist.cleaned && styles.checkboxActive]}>
                {checklist.cleaned && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Area cleaned up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.lastCheckItem} onPress={() => toggleCheck('toolsRemoved')}>
              <View style={[styles.checkbox, checklist.toolsRemoved && styles.checkboxActive]}>
                {checklist.toolsRemoved && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Tools/materials removed</Text>
            </TouchableOpacity>
          </View>

          {/* Final Price Confirmation */}
          <View style={styles.summaryCard}>
            <Text style={styles.labelSmall}>Final Price Confirmation</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Price</Text>
              <Text style={styles.summaryValue}>₱{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Charges</Text>
              <Text style={[styles.summaryValue, styles.extraValue]}>+₱{additionalCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* Payment Collection */}
          <View style={styles.sectionCard}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionTitle}>Payment Collection</Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>

            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'digital' && styles.radioItemActive]}
              onPress={() => setPaymentMethod('digital')}
            >
              <View style={[styles.radioButton, paymentMethod === 'digital' && styles.radioButtonActive]}>
                {paymentMethod === 'digital' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <View style={styles.radioLabelRow}>
                  <Ionicons name="card-outline" size={18} color={paymentMethod === 'digital' ? '#00B761' : '#555'} />
                  <Text style={[styles.radioLabel, paymentMethod === 'digital' && styles.radioLabelActive]}>Digital (auto-charged)</Text>
                </View>
                <Text style={styles.radioSubLabel}>Automatically charged to customer</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'cash' && styles.radioItemActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={[styles.radioButton, paymentMethod === 'cash' && styles.radioButtonActive]}>
                {paymentMethod === 'cash' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <View style={styles.radioLabelRow}>
                  <Ionicons name="cash-outline" size={18} color={paymentMethod === 'cash' ? '#00B761' : '#555'} />
                  <Text style={[styles.radioLabel, paymentMethod === 'cash' && styles.radioLabelActive]}>Cash (confirm amount received)</Text>
                </View>
                <Text style={styles.radioSubLabel}>Confirm you received cash payment</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, !isAllChecked && styles.submitButtonDisabled]}
          disabled={!isAllChecked}
          onPress={() => router.push({ pathname: '/provider-success', params: { id: booking.id } } as any)}
        >
          <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
          <Text style={styles.submitButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      </View>
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
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  labelSmall: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  estimateBox: {
    alignItems: 'flex-end',
  },
  estimateLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  overEstimateText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    color: '#0D1B2A',
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B761',
    gap: 8,
  },
  uploadText: {
    color: '#00B761',
    fontWeight: '700',
    fontSize: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requiredAsterisk: {
    color: '#FF4D4D',
    fontSize: 16,
    marginLeft: 4,
    marginTop: -16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00B761',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00B761',
  },
  checkText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00B761',
    backgroundColor: '#F7FFF9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  extraValue: {
    color: '#00B761',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,183,97,0.1)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B761',
  },
  radioItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
    alignItems: 'center',
  },
  radioItemActive: {
    borderColor: '#00B761',
    backgroundColor: '#F7FFF9',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButtonActive: {
    borderColor: '#00B761',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B761',
  },
  radioContent: {
    flex: 1,
  },
  radioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
  },
  radioLabelActive: {
    color: '#0D1B2A',
  },
  radioSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  spacer: {
    height: 40,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#99E6C3',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
