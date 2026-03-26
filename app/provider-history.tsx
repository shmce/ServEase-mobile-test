import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getProviderPaymentHistory,
  type ProviderPaymentHistoryItem,
} from '@/services/paymentService';
import { getErrorMessage } from '@/lib/error-handling';

const formatCurrency = (amount: number) => `P${amount.toFixed(2)}`;
const formatDateTime = (value?: string | null) => {
  if (!value) return 'Recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent activity';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function ProviderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ProviderPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      async function load() {
        if (!user?.id) {
          setRows([]);
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        setError('');
        try {
          const data = await getProviderPaymentHistory(user.id);
          if (mounted) setRows(data);
        } catch (err) {
          if (mounted) setError(getErrorMessage(err, 'Failed to load history.'));
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
      load();
      return () => {
        mounted = false;
      };
    }, [user?.id])
  );

  const history = useMemo(() => {
    return rows
      .filter((r) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          r.booking_reference.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.service_title.toLowerCase().includes(q) ||
          getPaymentMethodLabel(r.method).toLowerCase().includes(q)
        );
      });
  }, [rows, search]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Service History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#888" />
        <TextInput style={styles.searchInput} placeholder="Search..." value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 20 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.ref}>{item.booking_reference}</Text>
            <Text style={styles.title}>{item.service_title}</Text>
            <Text style={styles.sub}>{item.customer_name}</Text>
            <Text style={styles.sub}>Net earnings: {formatCurrency(item.net_earnings)}</Text>
            <Text style={styles.sub}>Payment: {getPaymentMethodLabel(item.method)}</Text>
            <Text style={styles.sub}>Status: {getPaymentStatusLabel(item.status)}</Text>
            <Text style={styles.sub}>{formatDateTime(item.paid_at || item.created_at)}</Text>
          </View>
        )}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No history found.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  searchWrap: { margin: 12, backgroundColor: '#FFF', borderRadius: 10, height: 42, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 12 },
  ref: { fontSize: 12, color: '#667' },
  title: { fontSize: 14, fontWeight: '700', color: '#0D1B2A', marginTop: 4 },
  sub: { fontSize: 12, color: '#556', marginTop: 4 },
  empty: { textAlign: 'center', color: '#778', marginTop: 24 },
  error: { color: '#C62828', paddingHorizontal: 12 },
});

