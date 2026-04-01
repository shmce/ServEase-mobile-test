import React, { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCustomerSession } from '@/lib/customer-session';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { getCustomerBookings } from '@/services/bookingService';
import { getServiceCategories } from '@/services/marketplaceService';
import { getErrorMessage } from '@/lib/error-handling';
import {
  getCustomerChatSummaries,
  subscribeToChatSummaries,
  type ChatSummary,
} from '@/services/chatService';
import { getCustomerBookingPresentation } from '@/lib/booking-status';

const BookingCard = memo(({ item, chatSummary, onPress }: { 
  item: any; 
  chatSummary?: ChatSummary; 
  onPress: (item: any) => void 
}) => {
  const needsReply = Boolean((chatSummary?.unreadCount || 0) > 0);
  return (
    <TouchableOpacity
      style={[styles.bookingCard, needsReply && styles.bookingCardAttention]}
      onPress={() => onPress(item)}
    >
      <View>
        <Text style={styles.bookingService}>{item.service}</Text>
        <Text style={styles.bookingProvider}>{item.provider}</Text>
        {chatSummary ? (
          <View style={styles.bookingContactRow}>
            <Text style={styles.bookingContactText} numberOfLines={1}>
              {chatSummary.lastMessage}
            </Text>
            {needsReply ? (
              <View style={styles.bookingAttentionChip}>
                <Text style={styles.bookingAttentionChipText}>Needs reply</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.bookingMeta}>
        <Text style={styles.bookingPrice}>{item.price}</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );
});

const CategoryCard = memo(({ category, onPress }: { 
  category: any; 
  onPress: (name: string) => void 
}) => (
  <TouchableOpacity
    style={styles.categoryCard}
    onPress={() => onPress(category.name)}
  >
    <Text style={styles.categoryTitle}>{category.name}</Text>
    <Ionicons name="chevron-forward" size={18} color="#888" />
  </TouchableOpacity>
));

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentCustomer } = useCustomerSession();
  const unreadNotifications = useUnreadNotifications();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName =
    currentCustomer?.profile?.fullName?.trim().split(/\s+/)[0] ||
    currentCustomer?.signupName?.trim().split(/\s+/)[0] ||
    'Customer';

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [categoryRows, bookingRows] = await Promise.all([
        getServiceCategories(),
        user ? getCustomerBookings(user.id) : Promise.resolve([]),
      ]);

      setCategories(categoryRows || []);
      setRecentBookings((bookingRows || []).slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load home data.'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`home-bookings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'booking_svc',
          table: 'bookings',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          void loadHomeData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadHomeData, user?.id]);

  const loadChatSummaries = useCallback(async () => {
    if (!user?.id) {
      setChatSummaries([]);
      return;
    }

    try {
      const rows = await getCustomerChatSummaries(user.id);
      setChatSummaries(rows);
    } catch {
      setChatSummaries([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadChatSummaries();
  }, [loadChatSummaries]);

  useEffect(() => {
    if (!user?.id) return;

    return subscribeToChatSummaries({
      role: 'customer',
      userId: user.id,
      onChange: () => {
        void loadChatSummaries();
      },
    });
  }, [loadChatSummaries, user?.id]);

  const mappedBookings = useMemo(
    () => {
      const seen = new Set<string>();

      return recentBookings.reduce((acc: any[], b: any) => {
        const presentation = getCustomerBookingPresentation(b?.status);
        if (presentation.normalizedStatus !== 'completed') {
          return acc;
        }

        const providerId = String(b?.provider_id || '').trim();
        const serviceId = String(b?.service_id || '').trim();
        const serviceTitle = String(b?.service?.title || 'Service Booking').trim();
        const providerName = String(b?.provider?.full_name || 'Service Provider').trim();
        const uniqueKey = `${providerId || providerName}::${serviceId || serviceTitle}`;

        if (seen.has(uniqueKey)) {
          return acc;
        }

        seen.add(uniqueKey);
        acc.push({
          id: String(b.id),
          providerId,
          serviceId,
          service: serviceTitle,
          provider: providerName,
          price: `P${Number(b.total_amount || 0).toFixed(2)}`,
          phone: b?.provider?.contact_number || '',
          address: String(b?.service_address || '').trim(),
          date: b?.scheduled_at || '',
        });
        return acc;
      }, []);
    },
    [recentBookings]
  );

  const chatSummaryMap = useMemo(
    () => new Map(chatSummaries.map((summary) => [summary.bookingId, summary])),
    [chatSummaries]
  );

  const prioritizedBookings = useMemo(
    () =>
      [...mappedBookings].sort((left, right) => {
        const leftUnread = chatSummaryMap.get(left.id)?.unreadCount || 0;
        const rightUnread = chatSummaryMap.get(right.id)?.unreadCount || 0;
        return rightUnread - leftUnread;
      }),
    [chatSummaryMap, mappedBookings]
  );

  const onBookingPress = useCallback((item: any) => {
    const chatSummary = chatSummaryMap.get(item.id);
    const needsReply = Boolean((chatSummary?.unreadCount || 0) > 0);

    if (needsReply) {
      router.push({
        pathname: '/customer-chat',
        params: {
          id: item.id,
          providerName: item.provider,
          serviceName: item.service,
          phone: item.phone,
        },
      } as any);
    } else {
      router.push({
        pathname: '/customer-book-again',
        params: {
          booking: JSON.stringify({
            id: item.id,
            rawId: item.id,
            providerId: item.providerId,
            serviceId: item.serviceId,
            service: item.service,
            providerName: item.provider,
            price: item.price,
            address: item.address,
            date: item.date,
            provider: {
              name: item.provider,
              phone: item.phone,
              specialty: item.service,
            },
          }),
        },
      } as any);
    }
  }, [chatSummaryMap, router]);

  const onCategoryPress = useCallback((name: string) => {
    router.push({
      pathname: '/category-details',
      params: { title: name },
    });
  }, [router]);

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
            <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications' as any)}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <NotificationBadge
                count={unreadNotifications}
                top={-4}
                right={-4}
                borderColor="#00C853"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 20 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Book it again</Text>
        {prioritizedBookings.length === 0 && !isLoading ? (
          <Text style={styles.emptyText}>No bookings yet.</Text>
        ) : null}
        {prioritizedBookings.map((item) => (
          <BookingCard 
            key={item.id} 
            item={item} 
            chatSummary={chatSummaryMap.get(item.id)}
            onPress={onBookingPress}
          />
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Browse all categories</Text>
        {categories.map((category) => (
          <CategoryCard 
            key={category.id} 
            category={category} 
            onPress={onCategoryPress}
          />
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
  bookingCardAttention: { borderWidth: 1, borderColor: '#BDE4CD', backgroundColor: '#FCFFFD' },
  bookingService: { fontSize: 14, fontWeight: '700', color: '#0D1B2A' },
  bookingProvider: { fontSize: 12, color: '#666', marginTop: 4 },
  bookingContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, maxWidth: 230 },
  bookingContactText: { flex: 1, fontSize: 12, color: '#6B7280' },
  bookingAttentionChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E8FBF2' },
  bookingAttentionChipText: { fontSize: 10, fontWeight: '700', color: '#00B761' },
  bookingMeta: { alignItems: 'flex-end' },
  bookingPrice: { fontSize: 13, color: '#00B761', fontWeight: '700' },
  categoryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  ctaCard: { marginTop: 20, backgroundColor: '#0D1B2A', borderRadius: 14, padding: 16 },
  ctaTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaSub: { color: '#D0D7DE', marginTop: 6, fontSize: 13 },
  emptyText: { color: '#777', marginBottom: 8 },
  errorText: { color: '#C62828', marginBottom: 8 },
});
