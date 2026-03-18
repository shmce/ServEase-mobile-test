import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOOKINGS_DATA } from './provider-bookings';

const { width } = Dimensions.get('window');

export default function ProviderReportIssueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  
  // Find the booking or default to a safe mock
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Booking Reference Card */}
          <View style={styles.referenceCard}>
            <Text style={styles.referenceLabel}>Booking Reference</Text>
            <Text style={styles.serviceName}>{booking.service}</Text>
            <Text style={styles.bookingId}>{booking.id}</Text>
            <Text style={styles.dateTime}>{booking.date} at {booking.time}</Text>
          </View>

          {/* Issue Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issue Type <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.pickerButton}>
              <Text style={styles.pickerText}>{issueType || 'Select issue type'}</Text>
              <Ionicons name="chevron-down" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Describe the Issue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Describe the Issue <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="Please provide detailed information about the issue you're experiencing..."
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500 characters</Text>
          </View>

          {/* Upload Evidence */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Evidence <Text style={styles.optional}>(Optional)</Text></Text>
            <TouchableOpacity style={styles.uploadArea}>
              <Ionicons name="cloud-upload-outline" size={32} color="#AAA" />
              <Text style={styles.uploadTitle}>Upload photos or screenshots</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG up to 10MB</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, (!issueType && !description) && styles.submitButtonDisabled]}
          onPress={() => router.back()}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  referenceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  referenceLabel: {
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
  bookingId: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  dateTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 12,
  },
  required: {
    color: '#FF4D4D',
  },
  optional: {
    color: '#8E8E93',
    fontWeight: '400',
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
  textInput: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    padding: 16,
    height: 140,
    fontSize: 14,
    color: '#0D1B2A',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'left',
    marginTop: 8,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#AAA',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#00B761' + '80', // Slightly transparent green as per image
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  submitButtonDisabled: {
    backgroundColor: '#00B761' + '40',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#0D1B2A',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: 40,
  },
});
