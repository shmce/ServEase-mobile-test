import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProviderBookingById } from '@/services/providerBookingService';
import { getErrorMessage } from '@/lib/error-handling';
import {
  getPaymentByBookingId,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/services/paymentService';

export default function ProviderReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return setIsLoading(false);
      try {
        const row = await getProviderBookingById(String(id));
        if (mounted) {
          setBooking(row);
          if (row?.id) {
            try {
              const pay = await getPaymentByBookingId(String(row.id));
              if (mounted) setPayment(pay);
            } catch {
              if (mounted) setPayment(null);
            }
          }
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load receipt.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onShare = async () => {
    if (!booking) return;
    await Share.share({ message: `Receipt ${booking.booking_reference || booking.id}: ${booking.service_title} - P${Number(booking.total_amount || 0).toFixed(2)}` });
  };

  const amount = Number(booking?.total_amount || 0);
  const platformFee = amount * 0.1;
  const earnings = amount - platformFee;
  const exitReceipt = () => {
    router.replace('/(provider-tabs)/bookings' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={exitReceipt}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Receipt</Text>
        <TouchableOpacity onPress={onShare}>
          <Ionicons name="share-outline" size={22} color="#0D1B2A" />
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 28 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && booking ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.ref}>{booking.booking_reference || booking.id}</Text>
          <Text style={styles.title}>{booking.service_title}</Text>
          <Text style={styles.sub}>Customer: {booking.customer_name}</Text>
          <Text style={styles.sub}>Address: {booking.service_address}</Text>
          <Text style={styles.sub}>Payment Status: {getPaymentStatusLabel(payment?.status || 'pending')}</Text>
          <Text style={styles.sub}>Payment Method: {getPaymentMethodLabel(payment?.method || 'cash')}</Text>
          {payment?.transaction_reference ? <Text style={styles.sub}>Transaction Ref: {String(payment.transaction_reference)}</Text> : null}
          <Text style={styles.sub}>Total Charged: P{amount.toFixed(2)}</Text>
          <Text style={styles.sub}>Platform Fee (10%): P{platformFee.toFixed(2)}</Text>
          <Text style={styles.earnings}>Your Earnings: P{earnings.toFixed(2)}</Text>

          <TouchableOpacity style={styles.doneBtn} onPress={exitReceipt}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  content: { padding: 20, gap: 8 },
  ref: { fontSize: 12, color: '#667' },
  title: { fontSize: 18, fontWeight: '800', color: '#0D1B2A' },
  sub: { fontSize: 14, color: '#445' },
  earnings: { marginTop: 8, fontSize: 16, fontWeight: '800', color: '#00B761' },
  doneBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#FFF', fontWeight: '700' },
  error: { color: '#C62828', padding: 12 },
});

