import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderBookings, ProviderBookingView, updateBookingStatus } from '@/services/providerBookingService';

const TABS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'] as const;
type Tab = typeof TABS[number];

export const BOOKINGS_DATA: any[] = [];

function statusToTab(statusRaw: string): Tab {
  const s = String(statusRaw || '').toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('complete') || s === 'done') return 'Completed';
  if (s.includes('confirm') || s.includes('accept')) return 'In Progress';
  if (s.includes('progress') || s.includes('ongoing')) return 'In Progress';
  return 'Upcoming';
}

function formatSchedule(ts?: string) {
  if (!ts) return { date: 'N/A', time: 'N/A' };
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return { date: 'N/A', time: 'N/A' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ProviderBookingView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = React.useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const rows = await getProviderBookings(user.id);
      setItems(rows);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load bookings.'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (statusToTab(b.status) !== activeTab) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        b.booking_reference.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.service_title.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab] = items.filter((b) => statusToTab(b.status) === tab).length;
      return acc;
    }, {} as Record<Tab, number>);
  }, [items]);

  const onConfirm = async (id: string) => {
    if (!user?.id) return;
    setBusyId(id);
    try {
      await updateBookingStatus(id, user.id, 'in_progress');
      Alert.alert('Booking Confirmed', 'Booking moved to In Progress.');
      await load();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to confirm booking.');
      setError(message);
      Alert.alert('Confirm Failed', message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab} ({counts[tab] || 0})</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#888" />
        <TextInput style={styles.searchInput} placeholder="Search bookings..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item }) => {
          const sc = formatSchedule(item.scheduled_at);
          const tab = statusToTab(item.status);
          return (
            <View style={styles.card}>
              <Text style={styles.bookingRef}>{item.booking_reference}</Text>
              <Text style={styles.title}>{item.service_title}</Text>
              <Text style={styles.sub}>{item.customer_name}</Text>
              <Text style={styles.sub}>{sc.date} at {sc.time}</Text>
              <Text style={styles.sub}>{item.service_address}</Text>
              <Text style={styles.amount}>P{item.total_amount.toFixed(2)}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: item.id } } as any)}
                >
                  <Text style={styles.secondaryText}>View Details</Text>
                </TouchableOpacity>

                {tab === 'Upcoming' ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => onConfirm(item.id)}
                    disabled={busyId === item.id}
                  >
                    <Text style={styles.primaryText}>{busyId === item.id ? 'Please wait...' : 'Confirm'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No bookings found.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F5F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0D1B2A' },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10, backgroundColor: '#fff' },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EEF1F5' },
  activeTabBtn: { backgroundColor: '#00B761' },
  tabText: { fontSize: 12, color: '#445' },
  activeTabText: { color: '#fff' },
  searchWrap: { margin: 10, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 42, alignItems: 'center', flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  bookingRef: { fontSize: 12, color: '#778' },
  title: { fontSize: 15, fontWeight: '700', color: '#0D1B2A', marginTop: 4 },
  sub: { fontSize: 12, color: '#556', marginTop: 2 },
  amount: { marginTop: 8, fontSize: 14, fontWeight: '800', color: '#00B761' },
  actions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, borderRadius: 8, backgroundColor: '#00B761', height: 38, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#D8DEE6', height: 38, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: '#223', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#889', marginTop: 20 },
  error: { color: '#C62828', paddingHorizontal: 12, paddingBottom: 8 },
});

