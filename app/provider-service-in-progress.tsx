import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { updateBookingStatus } from '@/services/providerBookingService';

export default function ProviderServiceInProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (!isPaused) {
      interval = setInterval(() => setTimer((p) => p + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const onComplete = async () => {
    if (!id || !user?.id) return;
    setIsSubmitting(true);
    try {
      await updateBookingStatus(String(id), user.id, 'completed');
      router.replace('/provider-bookings' as any);
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err, 'Could not complete service.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Service In Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsPaused((p) => !p)}>
          <Text style={styles.secondaryBtnText}>{isPaused ? 'Resume Timer' : 'Pause Timer'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} disabled={isSubmitting}>
          <Text style={styles.primaryBtnText}>{isSubmitting ? 'Please wait...' : 'Complete Service'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  timer: { fontSize: 48, fontWeight: '800', color: '#0D1B2A', textAlign: 'center' },
  primaryBtn: { height: 46, borderRadius: 10, backgroundColor: '#00B761', justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '700' },
  secondaryBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#D7DDE4', justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { fontWeight: '700', color: '#223' },
});

