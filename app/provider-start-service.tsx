import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderBookingById, updateBookingStatus } from '@/services/providerBookingService';

export default function ProviderStartServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState('123 Placeholder Street, Quezon City');
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function loadBookingAddress() {
      if (!id) return;
      setIsLoadingBooking(true);
      try {
        const data = await getProviderBookingById(String(id));
        if (mounted && data?.service_address) {
          setAddress(String(data.service_address));
        }
      } catch {
        // Keep placeholder address if fetch fails.
      } finally {
        if (mounted) setIsLoadingBooking(false);
      }
    }
    loadBookingAddress();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onStart = async () => {
    if (!id) {
      Alert.alert('Missing Booking', 'Booking id is missing. Please open this booking again.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in again before starting service.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateBookingStatus(String(id), user.id, 'in_progress');
      Alert.alert('Service Started', 'Booking is now in progress.', [{ text: 'OK', onPress: () => router.replace('/provider-bookings' as any) }]);
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err, 'Could not start service.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Start Service</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.info}>When ready, start this service and we will update the booking status in the database.</Text>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={18} color="#0D1B2A" />
            <Text style={styles.locationTitle}>Service Location (Placeholder)</Text>
          </View>
          <Text style={styles.locationAddress}>{isLoadingBooking ? 'Loading address...' : address}</Text>
          <Text style={styles.locationMeta}>Latitude: 14.6760</Text>
          <Text style={styles.locationMeta}>Longitude: 121.0437</Text>
          <Text style={styles.locationMeta}>Distance: 3.2 km | ETA: 12 mins</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={18} color="#64748B" />
            <Text style={styles.mapPlaceholderText}>Map Preview Placeholder</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={onStart} disabled={isSubmitting}>
          <Text style={styles.btnText}>{isSubmitting ? 'Please wait...' : 'Start Service'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  content: { padding: 16 },
  info: { color: '#556', marginBottom: 14 },
  locationCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  locationTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B2A' },
  locationAddress: { fontSize: 13, color: '#334155', marginBottom: 8 },
  locationMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  mapPlaceholder: { marginTop: 10, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', gap: 4 },
  mapPlaceholderText: { fontSize: 12, color: '#64748B' },
  btn: { backgroundColor: '#00B761', borderRadius: 10, height: 44, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700' },
});

