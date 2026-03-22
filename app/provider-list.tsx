import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

type Provider = {
  id: string;
  name: string;
  businessName: string;
  rating: number;
  reviews: number;
  description: string;
  completed: number;
  responseTime: string;
  status: 'Available' | 'Busy';
  location: string;
  price: string;
  initials: string;
};

const PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Juan dela Cruz',
    businessName: 'JDC Plumbing Services',
    rating: 4.9,
    reviews: 128,
    description: 'Licensed plumber with 15+ years experience. Specializing in leak repairs, pipe installation, and emergency service.',
    completed: 342,
    responseTime: 'within 30 mins',
    status: 'Available',
    location: 'Makati City',
    price: '₱500/hr',
    initials: 'JD',
  },
  {
    id: '2',
    name: 'Pedro Santos',
    businessName: 'Pedro Santos',
    rating: 4.7,
    reviews: 89,
    description: 'Expert in residential and commercial plumbing. Fast, reliable service with warranty on all work. Available for quick fixes.',
    completed: 215,
    responseTime: 'within 1 hour',
    status: 'Available',
    location: 'Quezon City',
    price: '₱400 - ₱800',
    initials: 'PS',
  },
  {
    id: '3',
    name: 'Roberto Aquino',
    businessName: 'Aquino Plumbing Solutions',
    rating: 4.8,
    reviews: 156,
    description: 'Professional plumber. Available 24/7 for emergencies. No job too small or too big. High quality materials used.',
    completed: 289,
    responseTime: 'within 45 mins',
    status: 'Busy',
    location: 'Pasig City',
    price: '₱450/hr',
    initials: 'RA',
  },
];

export default function ProviderListScreen() {
  const router = useRouter();
  const { serviceName = 'General Plumbing Repair' } = useLocalSearchParams<{ serviceName: string }>();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{serviceName}</Text>
              <Text style={styles.headerSubtitle}>{PROVIDERS.length} providers available</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Service Info Card */}
        <View style={styles.serviceInfoCard}>
          <View style={styles.serviceIconContainer}>
            <Ionicons name="briefcase" size={24} color="#00C853" />
          </View>
          <View style={styles.serviceInfoText}>
            <Text style={styles.serviceName}>{serviceName}</Text>
            <Text style={styles.categoryName}>Home Maintenance & Repair</Text>
            <Text style={styles.serviceDescription}>
              Browse through our verified service providers and choose the one that best fits your needs.
            </Text>
          </View>
        </View>

        {/* Providers List */}
        <View style={styles.providersList}>
          {PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerCard}
              onPress={() =>
                router.push({
                  pathname: '/provider-profile',
                  params: {
                    providerId: provider.id,
                    serviceName,
                    providerName: provider.name,
                  },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{provider.initials}</Text>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: provider.status === 'Available' ? '#00C853' : '#FF3B30' }]} />
                </View>
                <View style={styles.providerBasics}>
                  <Text style={styles.businessName}>{provider.businessName}</Text>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFD600" />
                    <Text style={styles.ratingText}>{provider.rating}</Text>
                    <Text style={styles.reviewsText}>({provider.reviews} reviews)</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.providerBio} numberOfLines={2}>
                {provider.description}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Completed</Text>
                  <Text style={styles.statValue}>{provider.completed}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Response</Text>
                  <Text style={styles.statValue}>{provider.responseTime}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Status</Text>
                  <Text style={[styles.statValue, { color: provider.status === 'Available' ? '#00C853' : '#FF3B30' }]}>
                    {provider.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={16} color="#999" />
                  <Text style={styles.locationText}>{provider.location}</Text>
                </View>
                <Text style={styles.priceText}>{provider.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  serviceInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  serviceInfoText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  providersList: {
    paddingHorizontal: 20,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  providerBasics: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  providerBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 15,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
  },
});
