import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

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

const getInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const CATEGORY_HEROES: Record<string, { image: string; description: string }> = {
  'Home Maintenance & Repair': {
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=1000',
    description: "Expert plumbing, electrical, and structural repairs for your home.",
  },
  'Beauty, Wellness & Personal Care': {
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000',
    description: "Professional spa, salon, and wellness services at your doorstep.",
  },
  'Education & Professional Services': {
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
    description: "Academic tutoring, music lessons, and professional consulting.",
  },
  'Domestic & Cleaning Services': {
    image: 'https://images.unsplash.com/photo-1581578731522-745a05ad9ad5?auto=format&fit=crop&q=80&w=1000',
    description: "Sparkling clean homes with our professional domestic services.",
  },
  'Pet Services': {
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1000',
    description: "Compassionate grooming, walking, and sitting for your furry friends.",
  },
  'Events & Entertainment': {
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000',
    description: "Unforgettable celebrations with expert planning and entertainment.",
  },
  'Automotive & Tech Support': {
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1000',
    description: "Expert car repairs and reliable tech support for your gadgets.",
  }
};


export default function ProviderListScreen() {
  const router = useRouter();
  const { 
    serviceName = 'General Plumbing Repair',
    serviceImage 
  } = useLocalSearchParams<{ serviceName: string; serviceImage?: string }>();
  
  const [categoryName, setCategoryName] = useState<string>('Services');
  const finalHeroImage = serviceImage || CATEGORY_HEROES[categoryName]?.image || CATEGORY_HEROES['Home Maintenance & Repair'].image;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch providers from Supabase
  useEffect(() => {
    async function fetchProviders() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*, provider_profiles(*, user_profiles(full_name, bio, avatar_url))')
          .eq('title', serviceName);

        if (error) {
          console.error('Error fetching providers:', error);
          return;
        }

        if (data && data.length > 0) {
          if (data[0].category) setCategoryName(data[0].category);
          
          const formattedProviders: Provider[] = [];
          data.forEach((service: any) => {
            if (!service.provider_profiles) return;
            const provider = service.provider_profiles;
            const fullName = provider.user_profiles?.full_name || 'Service Provider';
            formattedProviders.push({
              id: provider.id,
              name: fullName,
              businessName: fullName, // Using name as business name since not in DB
              rating: provider.rating || 4.5,
              reviews: provider.total_reviews || 0,
              description: provider.user_profiles?.bio || 'Professional service provider',
              completed: Math.floor((provider.total_reviews || 0) * 2), // Estimate based on reviews
              responseTime: 'within 1 hour',
              status: 'Available' as const,
              location: provider.service_areas?.[0] || 'Metro Manila',
              price: service.starting_price ? `₱${service.starting_price}` : 'Contact for price',
              initials: getInitials(fullName),
            });
          });
          
          setProviders(formattedProviders);
        }
      } catch (err) {
        console.error('Error in fetchProviders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviders();
  }, [serviceName]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Absolute Background Hero */}
      <View style={styles.absoluteHeroContainer}>
        <ImageBackground 
          source={{ uri: finalHeroImage }}
          style={styles.heroBackground}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroStaticContent}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{serviceName}</Text>
                <Text style={styles.heroCategory}>{categoryName}</Text>
                <Text style={styles.heroSubtitle}>
                  Browse through our verified service providers and choose the one that best fits your needs.
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="people" size={12} color="#00C853" />
                  <Text style={styles.badgeText}>{providers.length} providers available</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Static Header Overlays */}
      <SafeAreaView style={styles.navHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Empty Spacer to push content below the static hero */}
        <View style={styles.heroSpacer} />

        {/* Loading State */}
        {isLoading && (
          <View style={[styles.providersList, { alignItems: 'center', justifyContent: 'center', height: 300 }]}>
            <ActivityIndicator size="large" color="#00C853" />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading providers...</Text>
          </View>
        )}

        {/* Providers List */}
        {!isLoading && (
          <View style={styles.providersList}>
            {providers.map((provider) => (
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
        )}
      </ScrollView>

      {/* Absolute Background Hero - ON TOP */}
      <View style={styles.absoluteHeroContainer} pointerEvents="none">
        <ImageBackground 
          source={{ uri: finalHeroImage }}
          style={styles.heroBackground}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroStaticContent}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{serviceName}</Text>
                <Text style={styles.heroCategory}>{categoryName}</Text>
                <Text style={styles.heroSubtitle}>
                  Browse through our verified service providers and choose the one that best fits your needs.
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="people" size={12} color="#00C853" />
                  <Text style={styles.badgeText}>{providers.length} providers available</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <SafeAreaView style={styles.navHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  absoluteHeroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroBackground: {
    flex: 1,
    width: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  heroStaticContent: {
    width: '100%',
  },
  navHeader: {
    position: 'absolute',
    top: 5,
    left: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroSpacer: {
    height: 320,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  heroInfo: {
    marginBottom: 0,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroCategory: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 10,
    lineHeight: 18,
    maxWidth: '95%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  providersList: {
    paddingHorizontal: 20,
    marginTop: 25,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    minHeight: 500,
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
