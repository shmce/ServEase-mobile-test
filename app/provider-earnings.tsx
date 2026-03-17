import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// SVG Path for the mock line chart
const CHART_PATH = `M 0 120 L 40 100 L 80 150 L 120 40 L 160 140 L 200 90 L 240 60 L 280 45`;
const DATA_POINTS = [
  { x: 0, y: 120 }, { x: 40, y: 100 }, { x: 80, y: 150 }, { x: 120, y: 40 },
  { x: 160, y: 140 }, { x: 200, y: 90 }, { x: 240, y: 60 }, { x: 280, y: 45 }
];

export default function ProviderEarningsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Today' | 'This Week' | 'This Month' | 'All Time'>('This Month');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Dashboard</Text>
        <View style={{ width: 40 }} /> {/* Placeholder to center title */}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Controls & Total */}
        <View style={styles.topSection}>
            <View style={styles.segmentControl}>
                {['Today', 'This Week', 'This Month', 'All Time'].map((tab) => (
                    <TouchableOpacity 
                        key={tab}
                        style={[styles.segmentButton, activeTab === tab && styles.segmentButtonActive]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.totalEarningsContainer}>
                <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
                <View style={styles.totalEarningsRow}>
                    <Text style={styles.totalAmountText}>₱12,450</Text>
                    <View style={styles.growthPill}>
                        <Ionicons name="trending-up" size={12} color="#00B761" />
                        <Text style={styles.growthText}>+12%</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Earnings Trend</Text>
            
            <View style={styles.chartCard}>
                {/* Mock Chart Area */}
                <View style={styles.mockChartContainer}>
                     <View style={styles.yAxisLabels}>
                         <Text style={styles.axisText}>3200</Text>
                         <Text style={styles.axisText}>2400</Text>
                         <Text style={styles.axisText}>1600</Text>
                         <Text style={styles.axisText}>800</Text>
                         <Text style={styles.axisText}>0</Text>
                     </View>

                     <View style={styles.chartArea}>
                         {/* Grid Lines */}
                         <View style={[styles.gridLine, { bottom: '0%' }]} />
                         <View style={[styles.gridLine, { bottom: '25%' }]} />
                         <View style={[styles.gridLine, { bottom: '50%' }]} />
                         <View style={[styles.gridLine, { bottom: '75%' }]} />
                         <View style={[styles.gridLine, { bottom: '100%' }]} />

                         {/* Mock Line (drawn using absolute positioned views connecting dots for a pure RN approach without SVG dependency) */}
                         <View style={styles.mockLineContainer}>
                             <View style={[styles.lineSegment, { left: 0, bottom: 65, width: 46, transform: [{ rotate: '-26deg' }] }]} />    
                             <View style={[styles.lineSegment, { left: 40, bottom: 95, width: 62, transform: [{ rotate: '52deg' }] }]} />    
                             <View style={[styles.lineSegment, { left: 80, bottom: 95, width: 95, transform: [{ rotate: '-68deg' }] }]} />    
                             <View style={[styles.lineSegment, { left: 120, bottom: 90, width: 75, transform: [{ rotate: '52deg' }] }]} />    
                             <View style={[styles.lineSegment, { left: 160, bottom: 125, width: 75, transform: [{ rotate: '36deg' }] }]} />    
                             <View style={[styles.lineSegment, { left: 200, bottom: 155, width: 50, transform: [{ rotate: '20deg' }] }]} />    
                             
                             <View style={[styles.chartDot, { left: -4, bottom: 50 }]} />
                             <View style={[styles.chartDot, { left: 36, bottom: 30 }]} />
                             <View style={[styles.chartDot, { left: 76, bottom: 110 }]} />
                             <View style={[styles.chartDot, { left: 116, bottom: 40 }]} />
                             <View style={[styles.chartDot, { left: 156, bottom: 85 }]} />
                             <View style={[styles.chartDot, { left: 196, bottom: 115 }]} />
                             <View style={[styles.chartDot, { left: 236, bottom: 130 }]} />
                         </View>
                         
                         {/* X-Axis */}
                         <View style={styles.xAxis}>
                            <Text style={styles.axisText}>Mar 6</Text>
                            <Text style={styles.axisText}>Mar 7</Text>
                            <Text style={styles.axisText}>Mar 8</Text>
                            <Text style={styles.axisText}>Mar 9</Text>
                            <Text style={styles.axisText}>Mar 10</Text>
                            <Text style={styles.axisText}>Mar 12</Text>
                         </View>
                     </View>
                </View>
            </View>
        </View>

        {/* Payout Status Section */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payout Status</Text>
            
            <View style={styles.payoutStatusRow}>
                <View style={styles.payoutCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#FFF7E6' }]}>
                        <Ionicons name="time-outline" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.payoutCardLabel}>Pending</Text>
                    <Text style={styles.payoutCardValue}>₱1,530</Text>
                </View>
                
                <View style={styles.payoutCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="card-outline" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.payoutCardLabel}>Processing</Text>
                    <Text style={styles.payoutCardValue}>₱850</Text>
                </View>
                
                <View style={styles.payoutCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.payoutCardLabel}>Paid Out</Text>
                    <Text style={styles.payoutCardValue}>₱10,920</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryAction}>
                    <Ionicons name="wallet-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryActionText}>Request Payout</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                    <Ionicons name="download-outline" size={20} color="#0D1B2A" />
                    <Text style={styles.secondaryActionText}>Download</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Performance Metrics Section */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            
            <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="briefcase-outline" size={16} color="#6366F1" />
                        </View>
                        <Text style={styles.metricCardLabel}>Completed</Text>
                    </View>
                    <Text style={styles.metricCardValue}>47</Text>
                    <Text style={styles.metricSubtext}>Bookings</Text>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#FFFBEB' }]}>
                            <Ionicons name="cash-outline" size={16} color="#F59E0B" />
                        </View>
                        <Text style={styles.metricCardLabel}>Avg. Value</Text>
                    </View>
                    <Text style={styles.metricCardValue}>₱2,650</Text>
                    <Text style={styles.metricSubtext}>Per Booking</Text>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="logo-usd" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.metricCardLabel}>Total Tips</Text>
                    </View>
                    <Text style={styles.metricCardValue}>₱1,340</Text>
                    <Text style={styles.metricSubtextPositive}>+8% vs last period</Text>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                        <View style={[styles.iconBoxSmall, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                        </View>
                        <Text style={styles.metricCardLabel}>Platform Fees</Text>
                    </View>
                    <Text style={styles.metricCardValue}>₱1,868</Text>
                    <Text style={styles.metricSubtext}>15% of total</Text>
                </View>
            </View>
        </View>

        {/* Earnings by Category */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Earnings by Service Category</Text>
            
            <View style={styles.categoryCard}>
                {/* Mock Pie Chart UI */}
                <View style={styles.mockPieChartContainer}>
                    <View style={styles.mockPieChart}>
                        <View style={[styles.pieSlice, styles.slicePurple, { transform: [{ rotate: '0deg' }] }]} />
                        <View style={[styles.pieSlice, styles.sliceBlue, { transform: [{ rotate: '90deg' }] }]} />
                        <View style={[styles.pieSlice, styles.sliceGreen, { transform: [{ rotate: '180deg' }] }]} />
                        <View style={[styles.pieSlice, styles.sliceYellow, { transform: [{ rotate: '270deg' }] }]} />
                        
                        {/* Cutouts to make it look like slices */}
                        <View style={[styles.pieCutout, { transform: [{ rotate: '45deg' }] }]} />
                        <View style={[styles.pieCutout, { transform: [{ rotate: '135deg' }] }]} />
                        <View style={[styles.pieCutout, { transform: [{ rotate: '225deg' }] }]} />
                        <View style={[styles.pieCutout, { transform: [{ rotate: '315deg' }] }]} />
                    </View>

                    {/* Labels around the pie */}
                    <Text style={[styles.pieLabel, { top: 0, left: '60%' }]}>House Cleaning</Text>
                    <Text style={[styles.pieLabel, { top: '35%', left: 0 }]}>Plumbing 26%</Text>
                    <Text style={[styles.pieLabel, { bottom: 0, left: '25%' }]}>Electrical 22%</Text>
                    <Text style={[styles.pieLabel, { top: '45%', right: 0 }]}>Aircon Svcs</Text>
                </View>

                <View style={styles.pieLegend}>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#00B761' }]} />
                            <Text style={styles.legendText}>House Cleaning</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#0F766E' }]} />
                            <Text style={styles.legendText}>Plumbing</Text>
                        </View>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#2DD4BF' }]} />
                            <Text style={styles.legendText}>Electrical</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: '#6EE7B7' }]} />
                            <Text style={styles.legendText}>Aircon Services</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>

        {/* Top Earning Days */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Earning Days</Text>
            
            <View style={styles.barChartCard}>
                <View style={styles.barRow}>
                    <View style={styles.barLabelGroup}>
                        <Text style={styles.barTitle}>Monday</Text>
                        <Text style={styles.barValue}>₱3,200</Text>
                    </View>
                    <Text style={styles.barPercent}>100%</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '100%' }]} />
                </View>

                <View style={styles.barRow}>
                    <View style={styles.barLabelGroup}>
                        <Text style={styles.barTitle}>Wednesday</Text>
                        <Text style={styles.barValue}>₱2,850</Text>
                    </View>
                    <Text style={styles.barPercent}>89%</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '89%' }]} />
                </View>

                <View style={styles.barRow}>
                    <View style={styles.barLabelGroup}>
                        <Text style={styles.barTitle}>Saturday</Text>
                        <Text style={styles.barValue}>₱2,650</Text>
                    </View>
                    <Text style={styles.barPercent}>83%</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '83%' }]} />
                </View>

                <View style={styles.barRow}>
                    <View style={styles.barLabelGroup}>
                        <Text style={styles.barTitle}>Friday</Text>
                        <Text style={styles.barValue}>₱2,100</Text>
                    </View>
                    <Text style={styles.barPercent}>66%</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '66%' }]} />
                </View>
            </View>
            
            <View style={styles.efficiencyTip}>
                <View style={styles.tipIconBox}>
                    <Ionicons name="trending-up" size={16} color="#00B761" />
                </View>
                <View style={styles.tipTextGroup}>
                    <Text style={styles.tipTitle}>Efficiency Tip</Text>
                    <Text style={styles.tipDescription}>Your peak earning hours are <Text style={styles.tipHighlight}>10 AM - 2 PM on weekdays</Text>. Consider scheduling more availability during these times to maximize earnings.</Text>
                </View>
            </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  scrollContainer: {
    flex: 1,
  },
  topSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#00B761',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  totalEarningsContainer: {
    alignItems: 'center',
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  totalEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalAmountText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#00B761',
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FBF2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B761',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    paddingRight: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mockChartContainer: {
    flexDirection: 'row',
    height: 180,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 24,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  xAxis: {
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  mockLineContainer: {
    flex: 1,
    position: 'relative',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00B761',
    transformOrigin: 'left center', // RN mapping needed, handled differently normally
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B761',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  payoutStatusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  payoutCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  payoutCardLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  payoutCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00B761',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#0D1B2A',
    fontWeight: '600',
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 32 - 12) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricCardLabel: {
    fontSize: 12,
    color: '#555',
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#8E8E93',
  },
  metricSubtextPositive: {
    fontSize: 11,
    color: '#00B761',
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mockPieChartContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  mockPieChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: 70,
    height: 70,
    top: 0,
    left: 70,
    transformOrigin: 'bottom left',
  },
  slicePurple: { backgroundColor: '#00B761' },
  sliceBlue: { backgroundColor: '#0F766E' },
  sliceGreen: { backgroundColor: '#2DD4BF' },
  sliceYellow: { backgroundColor: '#6EE7B7' },
  pieCutout: {
    position: 'absolute',
    width: 160,
    height: 2,
    backgroundColor: '#FFF',
    top: 69,
    left: -10,
    transformOrigin: 'center center',
  },
  pieLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#00B761',
    fontWeight: '500',
  },
  pieLegend: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#444',
  },
  barChartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabelGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  barTitle: {
    fontSize: 13,
    color: '#0D1B2A',
    fontWeight: '500',
    width: 80,
  },
  barValue: {
    fontSize: 13,
    color: '#555',
  },
  barPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B761',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#E8FBF2',
    borderRadius: 3,
    marginBottom: 20,
  },
  barFill: {
    height: 6,
    backgroundColor: '#00B761',
    borderRadius: 3,
  },
  efficiencyTip: {
    flexDirection: 'row',
    backgroundColor: '#E8FBF2',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,183,97,0.2)',
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D1F7E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextGroup: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  tipHighlight: {
    color: '#00B761',
    fontWeight: '600',
  },
});
