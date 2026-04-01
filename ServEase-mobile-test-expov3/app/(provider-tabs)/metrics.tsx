import React, { useState } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

const { width } = Dimensions.get('window');

const MetricCard = ({ icon, label, value, tag, color }: any) => (
  <View style={styles.metricCard}>
    <View style={styles.metricCardHeader}>
      <View style={[styles.iconCircle, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      {tag && (
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      )}
    </View>
    <Text style={styles.metricLabelText}>{label}</Text>
    <View style={styles.metricValueRow}>
      <Text style={styles.metricValueText}>{value}</Text>
      {label === 'Response Time' && <Text style={styles.metricUnitText}> min</Text>}
    </View>
  </View>
);

const BenchmarkRow = ({ label, value, color, isPositive }: any) => (
  <View style={styles.benchmarkRow}>
    <View style={styles.benchmarkLabelRow}>
      <Text style={styles.benchmarkLabel}>{label}</Text>
      <Text style={[styles.benchmarkValue, { color: color }]}>{value}</Text>
    </View>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: '85%', backgroundColor: color }]} />
    </View>
  </View>
);

const RecommendedAction = ({ icon, title, description, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={styles.actionIconBg}>
      <Ionicons name={icon} size={22} color="#00B761" />
    </View>
    <View style={styles.actionContent}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription} numberOfLines={2}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);

export default function PerformanceMetricsScreen() {
  const router = useRouter();
  const unreadNotifications = useUnreadNotifications();
  const [trendsPeriod, setTrendsPeriod] = useState(30);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00B761" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Metrics</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications" size={24} color="#00B761" />
          <NotificationBadge count={unreadNotifications} top={-4} right={-4} borderColor="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.currentStatusLabel}>CURRENT STATUS</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>98</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>
          <Text style={styles.scoreDescription}>
            Your performance is in the top 2% of providers this month.
          </Text>
          
          <View style={styles.trendIndicatorCard}>
            <Ionicons name="trending-up" size={20} color="#FFF" />
            <View style={styles.trendTextContainer}>
              <Text style={styles.trendValue}>+4.2% from last month</Text>
              <View style={styles.trendUnderline} />
            </View>
          </View>
        </View>

        {/* Individual Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard 
            icon="time" 
            label="Response Time" 
            value="12" 
            tag="ELITE" 
            color="#00B761" 
          />
          <MetricCard 
            icon="checkmark-circle" 
            label="Completion" 
            value="99.4%" 
            color="#00B761" 
          />
          <MetricCard 
            icon="shield-checkmark" 
            label="Reliability" 
            value="100%" 
            color="#00B761" 
          />
        </View>

        {/* Performance Trends Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Trends</Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              style={[styles.periodBtn, trendsPeriod === 30 && styles.periodBtnActive]}
              onPress={() => setTrendsPeriod(30)}
            >
              <Text style={[styles.periodText, trendsPeriod === 30 && styles.periodTextActive]}>30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodBtn, trendsPeriod === 90 && styles.periodBtnActive]}
              onPress={() => setTrendsPeriod(90)}
            >
              <Text style={[styles.periodText, trendsPeriod === 90 && styles.periodTextActive]}>90 Days</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartPlaceholder}>
          <View style={styles.barGroup}>
            <View style={[styles.bar, { height: 60, opacity: 0.3 }]} />
            <View style={[styles.bar, { height: 100, opacity: 0.5 }]} />
            <View style={[styles.bar, { height: 80, opacity: 0.4 }]} />
            <View style={[styles.bar, { height: 120, opacity: 0.6 }]} />
            <View style={[styles.bar, { height: 140, opacity: 0.7 }]} />
            <View style={[styles.bar, { height: 150, backgroundColor: '#00B761' }]} />
            <View style={[styles.bar, { height: 170, backgroundColor: '#00B761' }]} />
          </View>
        </View>

        {/* Area Benchmarks Card */}
        <View style={styles.benchmarksCard}>
          <Text style={styles.cardTitle}>Area Benchmarks</Text>
          <BenchmarkRow label="VS. Local Average" value="+24% High" color="#00B761" isPositive />
          <BenchmarkRow label="VS. Top 10%" value="-2% Low" color="#64748B" />
          
          <View style={styles.globalRankBox}>
            <View style={styles.rankIconBg}>
               <Ionicons name="trophy" size={16} color="#00B761" />
            </View>
            <View>
              <Text style={styles.rankLabel}>GLOBAL RANK</Text>
              <Text style={styles.rankValue}>#142 in City</Text>
            </View>
          </View>
        </View>

        {/* Recommended Actions */}
        <Text style={styles.sectionTitlePadding}>Recommended Actions</Text>
        <RecommendedAction 
          icon="flash" 
          title="Enable Instant-Reply" 
          description="Providers who respond within 2 minutes see a 30% increase in bookings."
          onPress={() => {}}
        />
        <RecommendedAction 
          icon="people" 
          title="Repeat Rewards" 
          description="Set a discount for 3rd-time customers to boost your loyalty score."
          onPress={() => {}}
        />

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  notificationBtn: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  scoreCard: {
    backgroundColor: '#00B761',
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
  },
  currentStatusLabel: {
    color: '#E8FBF2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: 'Outfit-Bold',
  },
  scoreTotal: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
    fontWeight: '600',
  },
  scoreDescription: {
    color: '#E8FBF2',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  trendIndicatorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendTextContainer: {
    marginLeft: 12,
  },
  trendValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trendUnderline: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 8,
    width: 140,
  },
  metricsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  metricLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValueText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  metricUnitText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  sectionTitlePadding: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    marginTop: 16,
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    padding: 4,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  periodBtnActive: {
    backgroundColor: '#00B761',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFF',
  },
  chartPlaceholder: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    height: 240,
    justifyContent: 'flex-end',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  bar: {
    width: (width - 48 - 48 - 36) / 7,
    backgroundColor: '#00B761',
    borderRadius: 10,
  },
  benchmarksCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 24,
  },
  benchmarkRow: {
    marginBottom: 24,
  },
  benchmarkLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  benchmarkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  benchmarkValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#F1F1F5',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  globalRankBox: {
    backgroundColor: '#FAFAFE',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rankIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2,
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  footerSpacer: {
    height: 40,
  },
});

