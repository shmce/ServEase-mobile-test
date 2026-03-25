import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderBookingById, updateBookingStatus } from '@/services/providerBookingService';
import { getPaymentByBookingId } from '@/services/paymentService';

export default function ProviderBookingDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) {
        setError('Booking ID is missing.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const data = await getProviderBookingById(String(id));
        if (mounted) {
          setBooking(data);
          if (data?.id) {
            try {
              const pay = await getPaymentByBookingId(String(data.id));
              if (mounted) setPayment(pay);
            } catch {
              if (mounted) setPayment(null);
            }
          }
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load booking details.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const schedule = useMemo(() => {
    if (!booking?.scheduled_at) return 'N/A';
    const d = new Date(booking.scheduled_at);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }, [booking?.scheduled_at]);

  const onUpdate = async (target: 'in_progress' | 'completed' | 'cancelled' | 'confirmed') => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in again before updating booking.');
      return;
    }
    if (!booking?.id) {
      Alert.alert('Missing Booking', 'Booking id is missing.');
      return;
    }
    setBusy(true);
    try {
      await updateBookingStatus(booking.id, user.id, target);
      Alert.alert('Success', 'Booking updated.', [{ text: 'OK', onPress: () => router.replace('/provider-bookings' as any) }]);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to update booking.');
      setError(message);
      Alert.alert('Update Failed', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && booking ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.ref}>{booking.booking_reference || booking.id}</Text>
            <Text style={styles.title}>{booking.service_title}</Text>
            <Text style={styles.sub}>Customer: {booking.customer_name}</Text>
            <Text style={styles.sub}>When: {schedule}</Text>
            <Text style={styles.sub}>Address: {booking.service_address || 'N/A'}</Text>
            <Text style={styles.sub}>Status: {String(booking.status)}</Text>
            <Text style={styles.amount}>P{Number(booking.total_amount || 0).toFixed(2)}</Text>
            <Text style={styles.sub}>Payment Status: {String(payment?.status || 'not_recorded')}</Text>
            <Text style={styles.sub}>Payment Method: {String(payment?.method || 'not_recorded')}</Text>
            {payment?.transaction_reference ? (
              <Text style={styles.sub}>Transaction Ref: {String(payment.transaction_reference)}</Text>
            ) : null}
            {booking.service_description ? <Text style={styles.desc}>{booking.service_description}</Text> : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={() => onUpdate('confirmed')} disabled={busy}><Text style={styles.btnText}>Confirm</Text></TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() =>
                router.push({ pathname: '/provider-start-service', params: { id: booking.id } } as any)
              }
              disabled={busy}
            >
              <Text style={styles.btnText}>Start Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => onUpdate('completed')} disabled={busy}><Text style={styles.btnText}>Mark Complete</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={() => onUpdate('cancelled')} disabled={busy}><Text style={styles.btnDangerText}>Cancel Booking</Text></TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14 },
  ref: { fontSize: 12, color: '#667' },
  title: { fontSize: 16, fontWeight: '700', color: '#0D1B2A', marginTop: 4 },
  sub: { fontSize: 13, color: '#556', marginTop: 5 },
  amount: { marginTop: 8, fontSize: 16, fontWeight: '800', color: '#00B761' },
  desc: { marginTop: 8, color: '#445', fontSize: 13 },
  actions: { gap: 10 },
  btn: { height: 44, borderRadius: 10, backgroundColor: '#00B761', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700' },
  btnDanger: { height: 44, borderRadius: 10, backgroundColor: '#FFE6E6', justifyContent: 'center', alignItems: 'center' },
  btnDangerText: { color: '#C62828', fontWeight: '700' },
  error: { color: '#C62828', padding: 12 },
});

