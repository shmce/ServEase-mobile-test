import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderBookings } from '@/services/providerBookingService';

export default function ProviderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
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
          if (mounted) setError(getErrorMessage(err, 'Failed to load provider dashboard.'));
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

  const stats = useMemo(() => {
    const total = rows.length;
    const upcoming = rows.filter((r) => !String(r.status).toLowerCase().includes('cancel') && !String(r.status).toLowerCase().includes('complete')).length;
    const completed = rows.filter((r) => String(r.status).toLowerCase().includes('complete')).length;
    const earnings = rows
      .filter((r) => String(r.status).toLowerCase().includes('complete'))
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    return { total, upcoming, completed, earnings };
  }, [rows]);

  const upcomingRows = useMemo(() => {
    return rows.filter((r) => {
      const s = String(r.status).toLowerCase();
      return !s.includes('cancel') && !s.includes('complete');
    }).slice(0, 5);
  }, [rows]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SafeAreaView style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.name}>Provider Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.notif}><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          {isLoading ? <ActivityIndicator size="large" color="#00B761" /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>P{stats.earnings.toFixed(2)}</Text>
            <Text style={styles.earningsHint}>From completed services</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.card}><Text style={styles.k}>Total</Text><Text style={styles.v}>{stats.total}</Text></View>
            <View style={styles.card}><Text style={styles.k}>Upcoming</Text><Text style={styles.v}>{stats.upcoming}</Text></View>
            <View style={styles.card}><Text style={styles.k}>Completed</Text><Text style={styles.v}>{stats.completed}</Text></View>
            <View style={styles.card}><Text style={styles.k}>Earnings</Text><Text style={styles.v}>P{stats.earnings.toFixed(2)}</Text></View>
          </View>

          <Text style={styles.section}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/provider-bookings' as any)}>
              <Ionicons name="calendar-outline" size={20} color="#00B761" />
              <Text style={styles.quickText}>My Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(provider-tabs)/pricing' as any)}>
              <Ionicons name="cash-outline" size={20} color="#00B761" />
              <Text style={styles.quickText}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/provider-history' as any)}>
              <Ionicons name="time-outline" size={20} color="#00B761" />
              <Text style={styles.quickText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/provider-availability' as any)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#00B761" />
              <Text style={styles.quickText}>Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/provider-settings' as any)}>
              <Ionicons name="settings-outline" size={20} color="#00B761" />
              <Text style={styles.quickText}>Settings</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Upcoming</Text>
          {upcomingRows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming bookings.</Text>
            </View>
          ) : null}
          {upcomingRows.map((b) => {
            const d = b.scheduled_at ? new Date(b.scheduled_at) : null;
            return (
              <TouchableOpacity key={b.id} style={styles.row} onPress={() => router.push({ pathname: '/provider-booking-details', params: { id: b.id } } as any)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{b.service_title}</Text>
                  <Text style={styles.rowSub}>{b.customer_name}</Text>
                  <Text style={styles.rowSub}>{d ? d.toLocaleString() : 'N/A'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#888" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#00B761',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 14 : 4,
    paddingBottom: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { color: '#E4F8EC', fontSize: 11, lineHeight: 14 },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 24 },
  notif: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 14, gap: 10 },
  body: { paddingHorizontal: 14, gap: 10 },
  earningsCard: { backgroundColor: '#0D1B2A', borderRadius: 12, padding: 14 },
  earningsLabel: { color: '#A7B2BE', fontSize: 12 },
  earningsValue: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  earningsHint: { color: '#D0D7DE', marginTop: 4, fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  k: { color: '#667', fontSize: 12 },
  v: { color: '#0D1B2A', fontWeight: '800', fontSize: 16, marginTop: 4 },
  section: { marginTop: 8, fontWeight: '700', color: '#0D1B2A' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickText: { color: '#223', fontWeight: '700' },
  row: { backgroundColor: '#fff', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontWeight: '700', color: '#0D1B2A' },
  rowSub: { fontSize: 12, color: '#667', marginTop: 3 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 14 },
  emptyText: { color: '#778' },
  error: { color: '#C62828' },
});
