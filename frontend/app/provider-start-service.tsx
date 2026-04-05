import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchProviderBookingView, ProviderBookingView } from '@/lib/provider-booking';

const { width } = Dimensions.get('window');

export default function ProviderStartServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<ProviderBookingView | null>(null);

  const [checklist, setChecklist] = useState({
    scope: false,
    tools: false,
    instructions: false,
  });
  const [caption, setCaption] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetchProviderBookingView(id).then(setBooking).catch(() => setBooking(null));
  }, [id]);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isReady = checklist.scope && checklist.tools && checklist.instructions;

  // Format timer as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (!booking) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start Service</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heroTitle}>Ready to Start{'\n'}Service?</Text>

          {/* Customer Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <Text style={styles.labelSmall}>Customer</Text>
            </View>
            <View style={styles.customerInfo}>
              <Image 
                source={{ uri: booking.avatar }} 
                style={styles.avatar} 
              />
              <View>
                <Text style={styles.customerName}>{booking.customer}</Text>
                <Text style={styles.serviceName}>{booking.service}</Text>
              </View>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Service Checklist</Text>
            
            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('scope')}>
              <View style={[styles.checkbox, checklist.scope && styles.checkboxActive]}>
                {checklist.scope && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Service scope confirmed with customer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('tools')}>
              <View style={[styles.checkbox, checklist.tools && styles.checkboxActive]}>
                {checklist.tools && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>All necessary tools and materials ready</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('instructions')}>
              <View style={[styles.checkbox, checklist.instructions && styles.checkboxActive]}>
                {checklist.instructions && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkText}>Special instructions reviewed</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Take Before Photos</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Add caption (optional)"
              placeholderTextColor="#AAA"
              value={caption}
              onChangeText={setCaption}
            />
            <TouchableOpacity style={styles.uploadButton}>
              <Ionicons name="camera-outline" size={20} color="#00B761" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Timer Section */}
          <View style={[styles.sectionCard, styles.timerCard]}>
            <Text style={styles.timerLabel}>Service Timer</Text>
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={32} color="#0D1B2A" />
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
            <Text style={styles.timerStatus}>Ready to start</Text>
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, !isReady && styles.startButtonDisabled]}
          disabled={!isReady}
          onPress={() => router.push({ pathname: '/provider-service-in-progress', params: { id: booking.id } } as any)}
        >
          <Ionicons name="time-outline" size={20} color="#FFF" />
          <Text style={styles.startButtonText}>Start Service Timer</Text>
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
    lineHeight: 40,
  },
  customerCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  customerHeader: {
    marginBottom: 12,
  },
  labelSmall: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    flex: 1,
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    lineHeight: 20,
  },
  captionInput: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0D1B2A',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
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
  timerCard: {
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    paddingVertical: 32,
  },
  timerLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0D1B2A',
    fontVariant: ['tabular-nums'],
  },
  timerStatus: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
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
  startButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#99E6C3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
