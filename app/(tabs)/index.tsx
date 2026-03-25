import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCustomerSession } from '@/lib/customer-session';
import { useAuth } from '@/hooks/useAuth';
import { getCustomerBookings } from '@/services/bookingService';
import { getServiceCategories } from '@/services/marketplaceService';
import { getErrorMessage } from '@/lib/error-handling';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentCustomer } = useCustomerSession();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName =
    currentCustomer?.profile?.fullName?.trim().split(/\s+/)[0] ||
    currentCustomer?.signupName?.trim().split(/\s+/)[0] ||
    'Customer';

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [categoryRows, bookingRows] = await Promise.all([
          getServiceCategories(),
          user ? getCustomerBookings(user.id) : Promise.resolve([]),
        ]);

        if (!mounted) return;
        setCategories(categoryRows || []);
        setRecentBookings((bookingRows || []).slice(0, 5));
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load home data.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const mappedBookings = useMemo(
    () =>
      recentBookings.map((b: any) => ({
        id: String(b.id),
        service: b?.service?.title || 'Service Booking',
        provider: b?.provider?.full_name || 'Service Provider',
        price: `P${Number(b.total_amount || 0).toFixed(2)}`,
      })),
    [recentBookings]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>Good Day</Text>
              <Text style={styles.userNameText}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 20 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Book it again</Text>
        {mappedBookings.length === 0 ? <Text style={styles.emptyText}>No bookings yet.</Text> : null}
        {mappedBookings.map((item) => (
          <TouchableOpacity key={item.id} style={styles.bookingCard} onPress={() => router.push('/customer-book-again' as any)}>
            <View>
              <Text style={styles.bookingService}>{item.service}</Text>
              <Text style={styles.bookingProvider}>{item.provider}</Text>
            </View>
            <Text style={styles.bookingPrice}>{item.price}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Browse all categories</Text>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() =>
              router.push({
                pathname: '/category-details',
                params: { title: category.name },
              })
            }
          >
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.ctaCard} onPress={() => router.push('/provider-join' as any)}>
          <Text style={styles.ctaTitle}>Join the ServEase Team</Text>
          <Text style={styles.ctaSub}>Become a verified provider and start earning.</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#00C853', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 18, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  greetingText: { color: '#E0F2F1', fontSize: 12 },
  userNameText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  notificationBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A', marginBottom: 10 },
  bookingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingService: { fontSize: 14, fontWeight: '700', color: '#0D1B2A' },
  bookingProvider: { fontSize: 12, color: '#666', marginTop: 4 },
  bookingPrice: { fontSize: 13, color: '#00B761', fontWeight: '700' },
  categoryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  ctaCard: { marginTop: 20, backgroundColor: '#0D1B2A', borderRadius: 14, padding: 16 },
  ctaTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaSub: { color: '#D0D7DE', marginTop: 6, fontSize: 13 },
  emptyText: { color: '#777', marginBottom: 8 },
  errorText: { color: '#C62828', marginBottom: 8 },
});
