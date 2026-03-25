import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getProviderBookings } from '@/services/providerBookingService';
import { getErrorMessage } from '@/lib/error-handling';

export default function ProviderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
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
          const data = await getProviderBookings(user.id);
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
        const s = String(r.status).toLowerCase();
        return s.includes('complete') || s.includes('cancel');
      })
      .filter((r) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return r.booking_reference.toLowerCase().includes(q) || r.customer_name.toLowerCase().includes(q) || r.service_title.toLowerCase().includes(q);
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
            <Text style={styles.sub}>P{Number(item.total_amount || 0).toFixed(2)}</Text>
            <Text style={styles.sub}>Status: {String(item.status)}</Text>
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

