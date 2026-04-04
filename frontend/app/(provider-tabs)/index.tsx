import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderBookings, normalizeProviderBookingStatus } from '@/services/providerBookingService';
import { getProviderEarningsSummary } from '@/services/paymentService';
import { supabase } from '@/lib/supabase';
import {
  getProviderChatSummaries,
  subscribeToChatSummaries,
  type ChatSummary,
} from '@/services/chatService';

const { width: SCREEN_W } = Dimensions.get('window');

const STATUS_ACCENT: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_progress: '#00B761',
  completed: '#6366F1',
  cancelled: '#EF4444',
};

const formatScheduleShort = (ts?: string) => {
  if (!ts) return { date: '--', time: '--', day: '--' };
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return { date: '--', time: '--', day: '--' };
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    day: days[d.getDay()],
  };
};

export default function ProviderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const unreadNotifications = useUnreadNotifications();
  const [rows, setRows] = useState<any[]>([]);
  const [paidEarnings, setPaidEarnings] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const providerFirstName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    const fullName = String(meta.full_name || meta.name || '').trim();
    return fullName.split(/\s+/)[0] || 'Provider';
  }, [user]);

  const loadDashboard = React.useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const [data, earningsSummary] = await Promise.all([
        getProviderBookings(user.id),
        getProviderEarningsSummary(user.id),
      ]);
      setRows(data);
      setPaidEarnings(earningsSummary.totalNetEarnings);
      setPendingCollections(earningsSummary.pendingRevenue);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load provider dashboard.'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`provider-dashboard-bookings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'booking_svc',
          table: 'bookings',
          filter: `provider_id=eq.${user.id}`,
        },
        () => {
          void loadDashboard();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard, user?.id]);

  const loadChatSummaries = React.useCallback(async () => {
    if (!user?.id) {
      setChatSummaries([]);
      return;
    }

    try {
      const summaries = await getProviderChatSummaries(user.id);
      setChatSummaries(summaries);
    } catch {
      setChatSummaries([]);
    }
  }, [user?.id]);

  React.useEffect(() => {
    void loadChatSummaries();
  }, [loadChatSummaries]);

  React.useEffect(() => {
    if (!user?.id) return;

    return subscribeToChatSummaries({
      role: 'provider',
      userId: user.id,
      onChange: () => {
        void loadChatSummaries();
      },
    });
  }, [loadChatSummaries, user?.id]);

  const stats = useMemo(() => {
    const total = rows.length;
    const upcoming = rows.filter((r) => !String(r.status).toLowerCase().includes('cancel') && !String(r.status).toLowerCase().includes('complete')).length;
    const completed = rows.filter((r) => String(r.status).toLowerCase().includes('complete')).length;
    const cancelled = rows.filter((r) => String(r.status).toLowerCase().includes('cancel')).length;
    return { total, upcoming, completed, cancelled };
  }, [rows]);

  const upcomingRows = useMemo(() => {
    const summaryMap = new Map(chatSummaries.map((summary) => [summary.bookingId, summary]));

    return rows
      .filter((r) => {
        const s = String(r.status).toLowerCase();
        return !s.includes('cancel') && !s.includes('complete');
      })
      .sort((left, right) => {
        const leftUnread = summaryMap.get(String(left.id))?.unreadCount || 0;
        const rightUnread = summaryMap.get(String(right.id))?.unreadCount || 0;
        if (rightUnread !== leftUnread) return rightUnread - leftUnread;
        const leftTime = new Date(left.scheduled_at || 0).getTime();
        const rightTime = new Date(right.scheduled_at || 0).getTime();
        return leftTime - rightTime;
      })
      .slice(0, 5);
  }, [chatSummaries, rows]);

  const chatSummaryMap = useMemo(
    () => new Map(chatSummaries.map((summary) => [summary.bookingId, summary])),
    [chatSummaries]
  );

  const needsAttentionCount = useMemo(() => {
    let count = 0;
    for (const row of upcomingRows) {
      const summary = chatSummaryMap.get(String(row.id));
      if (summary && summary.unreadCount > 0) count++;
    }
    return count;
  }, [upcomingRows, chatSummaryMap]);

  const quickActions = useMemo(() => [
    { icon: 'calendar' as const, label: 'Bookings', route: '/provider-bookings', accent: '#3B82F6' },
    { icon: 'today' as const, label: 'Calendar', route: '/provider-calendar', accent: '#EF4444' },
    { icon: 'pricetag' as const, label: 'Pricing', route: '/(provider-tabs)/pricing', accent: '#00B761' },
    { icon: 'timer' as const, label: 'History', route: '/provider-history', accent: '#8B5CF6' },
    { icon: 'shield-checkmark' as const, label: 'Availability', route: '/provider-availability', accent: '#F59E0B' },
    { icon: 'construct' as const, label: 'More', route: '/(provider-tabs)/more', accent: '#64748B' },
  ], []);

  return (
    <View style={s.root}>
      {/* ── Dark header zone ── */}
      <View style={s.headerBg}>
        <SafeAreaView>
          <View style={s.headerInner}>
            <View style={s.headerLeft}>
              <Text style={s.greeting}>Good day,</Text>
              <Text style={s.providerName}>{providerFirstName}</Text>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity
                style={s.notifBtn}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications" size={20} color="#FFF" />
                <NotificationBadge
                  count={unreadNotifications}
                  top={-5}
                  right={-5}
                  borderColor="#0D1B2A"
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Earnings hero ── */}
        <View style={s.earningsHero}>
          <View style={s.earningsMain}>
            <Text style={s.earningsLabel}>Total Earnings</Text>
            <Text style={s.earningsAmount}>
              <Text style={s.earningsCurrency}>P</Text>
              {paidEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={s.earningsDivider} />
          <View style={s.pendingWrap}>
            <Text style={s.pendingLabel}>Pending</Text>
            <Text style={s.pendingAmount}>P{pendingCollections.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 20 }} /> : null}
        {error ? (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Stats strip ── */}
        <View style={s.statsStrip}>
          {[
            { label: 'Total', value: String(stats.total), color: '#0D1B2A' },
            { label: 'Active', value: String(stats.upcoming), color: '#00B761' },
            { label: 'Done', value: String(stats.completed), color: '#3B82F6' },
            { label: 'Cancelled', value: String(stats.cancelled), color: '#EF4444' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.statItem}
              activeOpacity={0.7}
              onPress={() => router.push('/provider-bookings' as any)}
            >
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick actions ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.actionsScroll}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={s.actionChip}
              activeOpacity={0.75}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[s.actionIconWrap, { backgroundColor: action.accent + '14' }]}>
                <Ionicons name={action.icon} size={18} color={action.accent} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Upcoming bookings ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Upcoming</Text>
          {needsAttentionCount > 0 ? (
            <View style={s.attentionBadge}>
              <Text style={s.attentionBadgeText}>{needsAttentionCount} needs reply</Text>
            </View>
          ) : null}
        </View>

        {upcomingRows.length === 0 && !isLoading ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
            </View>
            <Text style={s.emptyTitle}>No upcoming bookings</Text>
            <Text style={s.emptySub}>New booking requests will appear here</Text>
          </View>
        ) : null}

        {upcomingRows.map((b) => {
          const schedule = formatScheduleShort(b.scheduled_at);
          const chatSummary = chatSummaryMap.get(String(b.id));
          const needsReply = Boolean((chatSummary?.unreadCount || 0) > 0);
          const normalized = normalizeProviderBookingStatus(b.status);
          const accent = STATUS_ACCENT[normalized] || '#64748B';
          const statusLabel = normalized === 'in_progress' ? 'In Progress'
            : normalized.charAt(0).toUpperCase() + normalized.slice(1);

          return (
            <TouchableOpacity
              key={b.id}
              style={s.bookingCard}
              activeOpacity={0.8}
              onPress={() =>
                needsReply
                  ? router.push({
                      pathname: '/provider-chat',
                      params: {
                        id: b.id,
                        name: b.customer_name,
                        serviceName: b.service_title,
                      },
                    } as any)
                  : router.push({ pathname: '/provider-booking-details', params: { id: b.id } } as any)
              }
            >
              {/* Accent left edge */}
              <View style={[s.bookingAccent, { backgroundColor: accent }]} />

              <View style={s.bookingBody}>
                {/* Top row: service + status */}
                <View style={s.bookingTopRow}>
                  <Text style={s.bookingService} numberOfLines={1}>{b.service_title}</Text>
                  <View style={[s.statusPill, { backgroundColor: accent + '18' }]}>
                    <View style={[s.statusDot, { backgroundColor: accent }]} />
                    <Text style={[s.statusText, { color: accent }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Customer + schedule */}
                <View style={s.bookingMidRow}>
                  <View style={s.customerWrap}>
                    <View style={s.customerAvatar}>
                      <Text style={s.customerInitial}>
                        {(b.customer_name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={s.customerName} numberOfLines={1}>{b.customer_name}</Text>
                  </View>
                  <View style={s.scheduleWrap}>
                    <Text style={s.scheduleDay}>{schedule.day}</Text>
                    <Text style={s.scheduleDate}>{schedule.date}</Text>
                    <Text style={s.scheduleTime}>{schedule.time}</Text>
                  </View>
                </View>

                {/* Amount */}
                <View style={s.bookingBottomRow}>
                  <Text style={s.bookingAmount}>P{b.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>

                  {needsReply ? (
                    <View style={s.replyChip}>
                      <Ionicons name="chatbubble-ellipses" size={12} color="#FFF" />
                      <Text style={s.replyChipText}>Reply</Text>
                    </View>
                  ) : (
                    <View style={s.viewChip}>
                      <Text style={s.viewChipText}>View</Text>
                      <Ionicons name="arrow-forward" size={12} color="#64748B" />
                    </View>
                  )}
                </View>

                {/* Chat preview */}
                {chatSummary ? (
                  <View style={s.chatPreview}>
                    <Ionicons name="chatbubble-outline" size={12} color="#94A3B8" />
                    <Text style={s.chatPreviewText} numberOfLines={1}>
                      {chatSummary.lastMessage}
                    </Text>
                    {chatSummary.unreadCount > 0 ? (
                      <View style={s.unreadDot}>
                        <Text style={s.unreadDotText}>
                          {chatSummary.unreadCount > 9 ? '9+' : chatSummary.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {upcomingRows.length > 0 ? (
          <TouchableOpacity
            style={s.viewAllBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/provider-bookings' as any)}
          >
            <Text style={s.viewAllText}>View all bookings</Text>
            <Ionicons name="arrow-forward" size={14} color="#00B761" />
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // ── Header ──
  headerBg: {
    backgroundColor: '#0D1B2A',
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 6,
    paddingBottom: 4,
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  providerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // ── Earnings hero ──
  earningsHero: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  earningsMain: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  earningsAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#00B761',
    marginTop: 4,
    letterSpacing: -1,
  },
  earningsCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00B761',
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 18,
  },
  pendingWrap: {
    alignItems: 'flex-end',
  },
  pendingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 4,
    letterSpacing: -0.5,
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
    marginTop: -8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // ── Error ──
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // ── Quick actions (horizontal scroll) ──
  actionsScroll: {
    paddingBottom: 20,
    gap: 10,
  },
  actionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: (SCREEN_W - 70) / 3,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.2,
  },

  // ── Attention badge ──
  attentionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  attentionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // ── Booking card ──
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingAccent: {
    width: 4,
  },
  bookingBody: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingService: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginRight: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Customer + schedule row
  bookingMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  customerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  customerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  scheduleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  scheduleDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  scheduleTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  // Bottom row
  bookingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00B761',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  replyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  viewChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // Chat preview
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chatPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  unreadDot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },

  // ── View all ──
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,183,97,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,183,97,0.12)',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B761',
  },
});
