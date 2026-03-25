import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { updateBookingStatus } from '@/services/providerBookingService';

export default function ProviderCompleteServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onComplete = async () => {
    if (!id || !user?.id) return;
    setIsSubmitting(true);
    try {
      await updateBookingStatus(String(id), user.id, 'completed');
      Alert.alert('Completed', 'Service marked as completed.', [{ text: 'OK', onPress: () => router.replace('/provider-bookings' as any) }]);
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err, 'Could not complete booking.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Service</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.info}>Confirm completion to update this booking in the database.</Text>
        <TouchableOpacity style={styles.btn} onPress={onComplete} disabled={isSubmitting}>
          <Text style={styles.btnText}>{isSubmitting ? 'Please wait...' : 'Mark as Complete'}</Text>
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
  btn: { backgroundColor: '#00B761', borderRadius: 10, height: 44, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700' },
});

