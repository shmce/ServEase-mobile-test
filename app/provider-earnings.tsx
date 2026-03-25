import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const HistoryItem = ({ icon, category, date, duration, amount, status, iconBg }: any) => (
  <View style={styles.historyItem}>
    <View style={[styles.historyIconContainer, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color="#FFF" />
    </View>
    <View style={styles.historyInfo}>
      <Text style={styles.historyTitle}>{category}</Text>
      <Text style={styles.historySubtitle}>{date} • {duration}</Text>
    </View>
    <View style={styles.historyRight}>
      <Text style={styles.historyAmount}>+₱{amount}</Text>
      <View style={[styles.statusPill, status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending]}>
        <Text style={[styles.statusText, status === 'COMPLETED' ? styles.textCompleted : styles.textPending]}>{status}</Text>
      </View>
    </View>
  </View>
);

const BarChart = () => {
  const data = [
    { day: 'MON', value: 0.4 },
    { day: 'TUE', value: 0.6 },
    { day: 'WED', value: 0.5 },
    { day: 'THU', value: 0.85, highlighted: true },
    { day: 'FRI', value: 0.45 },
    { day: 'SAT', value: 0.65 },
    { day: 'SUN', value: 0.55 },
  ];

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsRow}>
        {data.map((item, index) => (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View 
                style={[
                  styles.barFill, 
                  { height: `${item.value * 100}%` },
                  item.highlighted ? styles.barHighlight : styles.barRegular
                ]} 
              />
            </View>
            <Text style={styles.dayText}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function ProviderEarningsScreen() {
  const router = useRouter();
  const [performanceTab, setPerformanceTab] = useState<'Weekly' | 'Monthly'>('Weekly');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Ledger</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#0D1B2A" />
        </TouchableOpacity>
      </View>      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Total Revenue */}
        <View style={styles.revenueSection}>
          <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueAmount}>₱12,840.00</Text>
            <View style={styles.growthPill}>
              <Text style={styles.growthText}>+12%</Text>
            </View>
          </View>
        </View>

        {/* Earnings Performance */}
        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Earnings Performance</Text>
            <View style={styles.performanceTabs}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.tabButton, performanceTab === 'Weekly' && styles.tabButtonActive]}
                onPress={() => setPerformanceTab('Weekly')}
              >
                <Text style={[styles.tabText, performanceTab === 'Weekly' && styles.tabTextActive]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.tabButton, performanceTab === 'Monthly' && styles.tabButtonActive]}
                onPress={() => setPerformanceTab('Monthly')}
              >
                <Text style={[styles.tabText, performanceTab === 'Monthly' && styles.tabTextActive]}>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>
          <BarChart />
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardsRow}>
          <View style={[styles.infoCard, { backgroundColor: '#E8FBF2' }]}>
            <View style={styles.infoIconBox}>
              <Ionicons name="time-outline" size={24} color="#00B761" />
            </View>
            <Text style={styles.infoLabel}>AVERAGE / SERVICE</Text>
            <Text style={styles.infoValue}>₱145.20</Text>
          </View>
        </View>

        <View style={styles.infoCardsRow}>
          <View style={[styles.infoCard, { backgroundColor: '#F0FFF7', marginBottom: 24 }]}>
            <View style={styles.infoIconBox}>
              <Ionicons name="wallet-outline" size={24} color="#00B761" />
            </View>
            <Text style={styles.infoLabel}>CASH ON HAND</Text>
            <Text style={styles.infoValue}>₱2,410.00</Text>
          </View>
        </View>

        {/* Recent History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historySectionTitle}>Recent History</Text>
            <TouchableOpacity onPress={() => router.push('/provider-history' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <HistoryItem 
            icon="brush-outline"
            category="Deep Home Clean"
            date="Oct 24, 2023"
            duration="4.5 Hours"
            amount="180.00"
            status="COMPLETED"
            iconBg="#3B82F6"
          />
          <HistoryItem 
            icon="hammer-outline"
            category="Garden Maintenance"
            date="Oct 22, 2023"
            duration="2 Hours"
            amount="95.00"
            status="PENDING"
            iconBg="#8B5CF6"
          />
          <HistoryItem 
            icon="water-outline"
            category="Emergency Plumbing"
            date="Oct 21, 2023"
            duration="1.5 Hours"
            amount="320.00"
            status="COMPLETED"
            iconBg="#00B761"
          />
          <HistoryItem 
            icon="flash-outline"
            category="Outlet Installation"
            date="Oct 19, 2023"
            duration="1 Hour"
            amount="75.00"
            status="COMPLETED"
            iconBg="#F59E0B"
          />
        </View>
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  notificationButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  revenueSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 32,
  },
  revenueLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  growthPill: {
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 16,
  },
  growthText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B761',
  },
  performanceCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 32,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
    marginRight: 16,
    flexShrink: 1,
  },
  performanceTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F7',
    borderRadius: 100,
    padding: 4,
    flexShrink: 0,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  tabButtonActive: {
    backgroundColor: '#00B761',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFF',
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 140,
    width: 28,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  barFill: {
    width: '100%',
    borderRadius: 14,
  },
  barRegular: {
    backgroundColor: '#F3F4F6',
  },
  barHighlight: {
    backgroundColor: '#00B761',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  infoCardsRow: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    borderRadius: 32,
    padding: 24,
    justifyContent: 'center',
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  historySection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B761',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#E8FBF2',
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textCompleted: {
    color: '#00B761',
  },
  textPending: {
    color: '#6B7280',
  },
  footerSpacer: {
    height: 40,
  },
});

