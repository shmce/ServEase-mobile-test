import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomerSession } from '@/lib/customer-session';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { getCustomerBookings } from '@/services/bookingService';
import { getServiceCategories } from '@/services/marketplaceService';
import { getErrorMessage } from '@/lib/error-handling';
import { TOP_LEVEL_CATEGORY_ITEMS } from '@/constants/service-taxonomy';
import {
  getCustomerChatSummaries,
  subscribeToChatSummaries,
  type ChatSummary,
} from '@/services/chatService';
import { getCustomerBookingPresentation } from '@/lib/booking-status';
import { BookingCarousel } from '@/components/BookingCarousel';
import { CategoryGrid } from '@/components/CategoryGrid';

const { width } = Dimensions.get('window');

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
      const [, bookingRows] = await Promise.all([
        getServiceCategories(),
        user ? getCustomerBookings(user.id) : Promise.resolve([]),
      ]);

      setCategories(TOP_LEVEL_CATEGORY_ITEMS);
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
      supabase.removeChannel(channel);
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
      
      <LinearGradient
        colors={['#00BF63', '#00BF63']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingText}>Good Day,</Text>
                <Text style={styles.userNameText}>{firstName} 👋</Text>
              </View>
              <TouchableOpacity 
                style={styles.notificationBtn} 
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications" size={24} color="#fff" />
                <NotificationBadge
                  count={unreadNotifications}
                  top={-2}
                  right={-2}
                  borderColor="#004D40"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.searchBarTrigger}
              onPress={() => {/* Navigation to search */}}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={20} color="#94A3B8" />
              <Text style={styles.searchPlaceholder}>Search for services...</Text>
              <View style={styles.searchBadge}>
                <Ionicons name="options-outline" size={18} color="#00C853" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Transparent spacer for header overlap if needed, but here we just flow */}
        
        {isLoading && categories.length === 0 ? (
          <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 40 }} />
        ) : (
          <View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Book it again</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings' as any)}>
                <Text style={styles.seeAllText}>View History</Text>
              </TouchableOpacity>
            </View>

            {prioritizedBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#E2E8F0" />
                <Text style={styles.emptyText}>No recent bookings found.</Text>
              </View>
            ) : (
              <BookingCarousel 
                bookings={prioritizedBookings} 
                chatSummaryMap={chatSummaryMap}
                onPress={onBookingPress}
              />
            )}

            <View style={[styles.sectionHeader, { marginTop: 12 }]}>
              <Text style={styles.sectionTitle}>Explore Categories</Text>
            </View>
            
            <CategoryGrid 
              categories={categories} 
              onPress={onCategoryPress} 
            />

            <TouchableOpacity 
              style={styles.ctaBanner} 
              onPress={() => router.push('/provider-join' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#00BF63', '#00BF63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <View style={styles.ctaContent}>
                  <View style={styles.ctaTextSection}>
                    <Text style={styles.ctaTitle}>Join the ServEase Team</Text>
                    <Text style={styles.ctaSub}>Become a verified provider and start earning today.</Text>
                  </View>
                  <View style={styles.ctaIconBox}>
                    <Ionicons name="rocket-outline" size={32} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.footerSpacer} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 16,
    marginBottom: 24,
  },
  greetingText: { 
    color: 'rgba(255,255,255,0.78)', 
    fontSize: 14,
    fontWeight: '500',
  },
  userNameText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notificationBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchBarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    color: '#94A3B8',
    fontSize: 15,
  },
  searchBadge: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 191, 99, 0.12)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { 
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: '#00BF63',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyText: { 
    color: '#94A3B8', 
    marginTop: 12,
    fontSize: 14,
  },
  errorText: { 
    color: '#EF4444', 
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  ctaBanner: { 
    marginTop: 32, 
    borderRadius: 24, 
    overflow: 'hidden',
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaGradient: {
    padding: 24,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTextSection: {
    flex: 1,
    marginRight: 16,
  },
  ctaTitle: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 18,
    marginBottom: 8,
  },
  ctaSub: { 
    color: 'rgba(255,255,255,0.82)', 
    fontSize: 13,
    lineHeight: 18,
  },
  ctaIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footerSpacer: {
    height: 40,
  }
});
