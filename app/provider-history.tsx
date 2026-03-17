import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, TextInput, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HISTORY_DATA = [
  {
    id: 'BK-45231',
    service: 'House Cleaning',
    status: 'Completed',
    date: 'Mar 10, 2026',
    customer: 'Marla Santos',
    location: 'Quezon City',
    serviceCharge: 2500,
    platformFee: 375,
    netEarnings: 2125,
    rating: 5,
  },
  {
    id: 'BK-4519B',
    service: 'Plumbing Repair',
    status: 'Completed',
    date: 'Mar 9, 2026',
    customer: 'Juan dela Cruz',
    location: 'Makati City',
    serviceCharge: 1800,
    platformFee: 270,
    netEarnings: 1530,
    rating: 4,
  },
  {
    id: 'BK-45142',
    service: 'Electrical Work',
    status: 'Completed',
    date: 'Mar 8, 2026',
    customer: 'Anna Reyes',
    location: 'Taguig City',
    serviceCharge: 3200,
    platformFee: 480,
    netEarnings: 2720,
    rating: 5,
  },
  {
    id: 'BK-450B9',
    service: 'Aircon Cleaning',
    status: 'Completed',
    date: 'Mar 7, 2026',
    customer: 'Pedro Garcia',
    location: 'Pasig City',
    serviceCharge: 1500,
    platformFee: 225,
    netEarnings: 1275,
    rating: 5,
  },
  {
    id: 'BK-45021',
    service: 'Home Cleaning',
    status: 'Cancelled',
    date: 'Mar 6, 2026',
    customer: 'Lisa Tan',
    location: 'Mandaluyong',
    serviceCharge: 2200,
    platformFee: 330,
    netEarnings: 0,
    rating: 0,
  },
  {
    id: 'BK-449B7',
    service: 'Painting Services',
    status: 'Completed',
    date: 'Mar 5, 2026',
    customer: 'Robert Cruz',
    location: 'Quezon City',
    serviceCharge: 4500,
    platformFee: 675,
    netEarnings: 3825,
    rating: 4,
  },
  {
    id: 'BK-44921',
    service: 'Garden Landscaping',
    status: 'Completed',
    date: 'Mar 4, 2026',
    customer: 'Grace Lim',
    location: 'Paranaque City',
    serviceCharge: 3500,
    platformFee: 525,
    netEarnings: 2975,
    rating: 5,
  },
];

const HistoryCard = ({ item }: { item: typeof HISTORY_DATA[0] }) => (
  <View style={styles.historyCard}>
    <View style={styles.cardHeader}>
      <View style={styles.titleContainer}>
        <Text style={styles.serviceTitle}>{item.service}</Text>
        <View style={[styles.statusBadge, item.status === 'Cancelled' ? styles.cancelledBadge : styles.completedBadge]}>
          <Ionicons 
            name={item.status === 'Completed' ? "checkmark-circle-outline" : "close-circle-outline"} 
            size={14} 
            color={item.status === 'Completed' ? "#00B761" : "#FF4D4D"} 
          />
          <Text style={[styles.statusText, item.status === 'Cancelled' ? styles.cancelledText : styles.completedText]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.bookingDetails}>{item.id} • {item.date}</Text>
    </View>

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Customer:</Text>
      <Text style={styles.infoValue}>{item.customer}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Location:</Text>
      <Text style={styles.infoValue}>{item.location}</Text>
    </View>

    <View style={styles.financeDivider} />

    <View style={styles.financeRow}>
      <Text style={styles.financeLabel}>Service Charge:</Text>
      <Text style={styles.financeValue}>₱{item.serviceCharge.toLocaleString()}</Text>
    </View>
    <View style={styles.financeRow}>
      <Text style={styles.financeLabel}>Platform Fee:</Text>
      <Text style={styles.platformFeeValue}>-₱{item.platformFee.toLocaleString()}</Text>
    </View>

    <View style={styles.earningsRow}>
      <Text style={styles.earningsLabel}>Net Earnings:</Text>
      <Text style={styles.earningsValue}>₱{item.netEarnings.toLocaleString()}</Text>
    </View>

    {item.status === 'Completed' && (
      <View style={styles.ratingRow}>
        <Text style={styles.infoLabel}>Customer Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star} 
              name={star <= item.rating ? "star" : "star-outline"} 
              size={14} 
              color="#FFB800" 
              style={styles.starIcon}
            />
          ))}
        </View>
      </View>
    )}
  </View>
);

export default function ProviderHistoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service History</Text>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#AAA" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={HISTORY_DATA.filter(item => 
          item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statValue, { color: '#00B761' }]}>₱23,675</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.6</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0D1B2A',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F0F0F0',
    borderRightColor: '#F0F0F0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  completedBadge: {
    backgroundColor: '#E8FBF2',
  },
  cancelledBadge: {
    backgroundColor: '#FFF2F2',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  completedText: {
    color: '#00B761',
  },
  cancelledText: {
    color: '#FF4D4D',
  },
  bookingDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  financeDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financeLabel: {
    fontSize: 13,
    color: '#555',
  },
  financeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  platformFeeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4D4D',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B761',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginLeft: 2,
  },
});
