import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BOOKINGS_DATA } from './provider-bookings';

const { width } = Dimensions.get('window');

export default function ProviderServiceInProgressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Find the booking or default
  const booking = BOOKINGS_DATA.find(b => b.id === id) || BOOKINGS_DATA[0];

  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Live timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isPaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval!);
  }, [isPaused]);

  // Format timer as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Dark Header/Timer Section */}
      <View style={styles.timerSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job in Progress</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerValue}>{formatTime(timer)}</Text>
          <Text style={styles.timerLabel}>Duration of service</Text>
        </View>

        <View style={styles.customerBrief}>
          <Image 
            source={{ uri: (booking as any).avatar }} 
            style={styles.briefAvatar} 
          />
          <View>
            <Text style={styles.briefName}>{booking.customer}</Text>
            <Text style={styles.briefService}>{booking.service}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => setIsPaused(!isPaused)}
            >
              <View style={[styles.actionIconContainer, isPaused && styles.actionIconPaused]}>
                <Ionicons name={isPaused ? "play" : "pause"} size={24} color={isPaused ? "#FFB800" : "#0D1B2A"} />
              </View>
              <Text style={styles.actionLabel}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/provider-messages' as any)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble" size={24} color="#0D1B2A" />
              </View>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/provider-additional-charges' as any)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle" size={24} color="#0D1B2A" />
              </View>
              <Text style={styles.actionLabel}>Charges</Text>
            </TouchableOpacity>
          </View>

          {/* Job Details Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Service Being Performed</Text>
            <Text style={styles.infoDescription}>
              {(booking as any).description}
            </Text>
            
            <View style={styles.locationSummary}>
              <Ionicons name="location-outline" size={16} color="#777" />
              <Text style={styles.locationText}>{booking.address}</Text>
            </View>
          </View>

          {/* Photos/Recording */}
          <View style={styles.recordingCard}>
            <View style={styles.recordingHeader}>
              <View style={styles.recordingStatus} />
              <Text style={styles.recordingTitle}>Recording Evidence</Text>
            </View>
            <Text style={styles.recordingSubtitle}>Add photos as you work to document progress</Text>
            
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.cameraButtonText}>Capture Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Complete Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => router.push({ pathname: '/provider-complete-service', params: { id: booking.id } } as any)}
        >
          <Text style={styles.completeButtonText}>Complete Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  timerSection: {
    backgroundColor: '#0D1B2A',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerValue: {
    color: '#FFF',
    fontSize: 64,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 5,
  },
  customerBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
  },
  briefAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  briefName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  briefService: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  content: {
    padding: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionItem: {
    alignItems: 'center',
    width: (width - 48) / 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconPaused: {
    backgroundColor: '#FFFBE6',
  },
  actionLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  infoDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 15,
  },
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  recordingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  recordingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B761',
    height: 56,
    borderRadius: 16,
    gap: 12,
  },
  cameraButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completeButton: {
    height: 56,
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
