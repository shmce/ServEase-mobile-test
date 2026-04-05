import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

// Fallback provider data for instant display while loading from DB
const FALLBACK_PROVIDERS: Record<string, any> = {
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d': { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Juan dela Cruz', businessName: 'JDC Plumbing & Repair', rating: 4.9, reviewCount: 128, bookings: 342, experience: '15+', bio: 'Licensed technician with 15+ years experience. Specializing in emergency fixes.', categories: ['Plumbing'], areas: ['Makati City', 'Pasig', 'Manila'], languages: ['English', 'Tagalog'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=30', badge: 'Verified', services: [], responseTime: 'within 30 mins', status: 'Available', price: '₱500/hr' },
  'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e': { id: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', name: 'Roberto Aquino', businessName: 'Aquino Builders', rating: 4.8, reviewCount: 156, bookings: 289, experience: '12+', bio: 'Expert in residential maintenance with fast, reliable service.', categories: ['Carpentry'], areas: ['Pasig City', 'Quezon City', 'Taguig'], languages: ['English', 'Tagalog'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=30', badge: 'Top Rated', services: [], responseTime: 'within 45 mins', status: 'Busy', price: '₱450/hr' },
  'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f': { id: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', name: 'Maria Santos', businessName: 'Sparkle Clean & Care', rating: 5.0, reviewCount: 204, bookings: 412, experience: '8+', bio: 'Professional cleaner trusted by hundreds of satisfied customers.', categories: ['Cleaning'], areas: ['BGC, Taguig', 'Makati', 'Paranaque'], languages: ['English', 'Tagalog'], avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=30', badge: 'Verified', services: [], responseTime: 'within 15 mins', status: 'Available', price: '₱350/hr' },
  'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a': { id: 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', name: 'Sarah Go', businessName: 'Glow Up By Sarah', rating: 4.9, reviewCount: 145, bookings: 200, experience: '6+', bio: 'Makeup artist specializing in natural, glowing looks.', categories: ['Beauty'], areas: ['Makati City', 'BGC', 'Ortigas'], languages: ['English', 'Tagalog'], avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=30', badge: 'Verified', services: [], responseTime: 'within 10 mins', status: 'Available', price: '₱1200/session' },
};

const TABS = ['About', 'Services', 'Portfolio', 'Reviews'];

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { providerId = 'hm1', serviceName = 'Plumbing Repair' } = useLocalSearchParams<{ providerId: string; serviceName?: string }>();
  const defaultProvider = FALLBACK_PROVIDERS['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'];

  const [provider, setProvider] = useState(FALLBACK_PROVIDERS[providerId] || defaultProvider);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('About');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // OPTIMIZED: Fetch all data in PARALLEL using Promise.all instead of sequential
  useEffect(() => {
    async function fetchProviderData() {
      try {
        // Show fallback data immediately, fetch details in background
        setIsLoadingDetails(true);

        // PARALLEL QUERIES - all at once, not one after another
        const [profileResult, servicesResult, reviewsResult] = await Promise.all([
          // Query 1: Provider profile + basic info
          supabase
            .from('provider_profiles')
            .select(`
              *,
              user_profiles(full_name, avatar_url, phone)
            `)
            .eq('id', providerId)
            .single(),

          // Query 2: Services
          supabase
            .from('services')
            .select('id, title, description, starting_price, duration')
            .eq('provider_id', providerId)
            .limit(10),

          // Query 3: Reviews (top 5 most recent)
          supabase
            .from('reviews')
            .select(`
              id, rating, content, created_at, image_url,
              user_profiles(full_name, avatar_url)
            `)
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        // Update provider with real data
        if (profileResult.data) {
          const pData = profileResult.data;
          setProvider((prev: any) => ({
            ...prev,
            ...pData,
            name: pData.user_profiles?.full_name || prev.name,
            avatar: pData.user_profiles?.avatar_url 
              ? `${pData.user_profiles.avatar_url}?w=150&q=30` 
              : prev.avatar,
            rating: pData.rating || prev.rating,
            reviewCount: pData.total_reviews || prev.reviewCount,
            bio: pData.bio || prev.bio,
            experience: pData.years_experience || prev.experience,
            areas: pData.service_areas || prev.areas,
            languages: pData.languages || prev.languages,
          }));
        }

        // Update services
        if (servicesResult.data && servicesResult.data.length > 0) {
          setServices(servicesResult.data);
        }

        // Update reviews
        if (reviewsResult.data && reviewsResult.data.length > 0) {
          setReviews(reviewsResult.data);
        }

        setIsLoadingDetails(false);
      } catch (error) {
        console.error('Error fetching provider data:', error);
        setIsLoadingDetails(false);
        // Fallback data already set, so UI still shows something
      }
    }

    fetchProviderData();
  }, [providerId]);

  const handleBookNowPress = useCallback(() => {
    router.push({
      pathname: '/customer-booking-form',
      params: { 
        providerId: provider.id, 
        providerName: provider.name, 
        serviceName, 
        price: provider.price 
      },
    });
  }, [provider.id, provider.name, provider.price, serviceName, router]);

  const handleMessagePress = useCallback(() => {
    router.push({
      pathname: '/customer-chat',
      params: { 
        providerId: provider.id, 
        providerName: provider.name, 
        serviceName 
      },
    });
  }, [provider.id, provider.name, serviceName, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fixed Sticky Header */}
      <SafeAreaView style={{ backgroundColor: '#00C853' }}>
        <View style={styles.headerNav}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Removed - Solid Green Section Only */}
        <View style={styles.heroSection}>  


          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: provider.avatar }} style={styles.avatarImage} />
            </View>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
              <View style={[styles.badge, styles.licensedBadge]}>
                <Ionicons name="ribbon" size={12} color="#fff" />
                <Text style={styles.badgeText}>Licensed</Text>
              </View>
              <View style={[styles.badge, styles.insuredBadge]}>
                <Ionicons name="document-text" size={12} color="#fff" />
                <Text style={styles.badgeText}>Insured</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color="#FFD600" />
            <Text style={styles.statValue}>{provider.rating}</Text>
            <Text style={styles.statLabel}>Overall Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.reviewCount}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.bookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.experience}</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabsContainer}>
          <View style={{ flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton, 
                  activeTab === tab && styles.activeTabButton,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', marginRight: 0 }
                ]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'About' && (
            <View style={styles.aboutTab}>
              {/* Bio Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{provider.bio}</Text>
              </View>

              {/* Service Categories */}
              {provider.categories && provider.categories.length > 0 && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Service Categories</Text>
                  <View style={styles.tagRow}>
                    {provider.categories.map((cat: string) => (
                      <View key={cat} style={styles.tag}>
                        <Text style={styles.tagText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Service Areas */}
              {provider.areas && provider.areas.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="location-outline" size={20} color="#00C853" />
                    <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Service Areas</Text>
                  </View>
                  <View style={styles.tagRow}>
                    {provider.areas.map((area: string) => (
                      <View key={area} style={styles.tag}>
                        <Text style={styles.tagText}>{area}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Languages */}
              {provider.languages && provider.languages.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialCommunityIcons name="translate" size={20} color="#00C853" />
                    <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Languages</Text>
                  </View>
                  <View style={styles.tagRow}>
                    {provider.languages.map((lang: string) => (
                      <View key={lang} style={styles.tag}>
                        <Text style={styles.tagText}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Services' && (
            <View style={styles.servicesTab}>
              {isLoadingDetails && services.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00C853" />
                  <Text style={{ color: '#999', marginTop: 10 }}>Loading services...</Text>
                </View>
              ) : services.length > 0 ? (
                services.map((service: any) => (
                  <View key={service.id} style={styles.serviceItemCard}>
                    <Text style={styles.serviceItemTitle}>{service.title}</Text>
                    <Text style={styles.serviceItemDescription}>{service.description}</Text>
                    <View style={styles.serviceItemDetails}>
                      <View style={styles.durationRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.durationText}>{service.duration || '2-4 hours'}</Text>
                      </View>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.serviceItemPrice}>₱{service.starting_price}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addToBookingButton}
                      onPress={() => router.push({
                        pathname: '/customer-booking-form',
                        params: {
                          providerId: provider.id,
                          serviceId: service.id,
                          serviceName: service.title,
                        }
                      })}
                    >
                      <Text style={styles.addToBookingText}>Book This Service</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#999' }}>No services listed yet.</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Portfolio' && (
            <View style={styles.portfolioTab}>
              <View style={styles.portfolioGrid}>
                {[1, 2].map((id) => (
                  <View key={id} style={styles.projectCard}>
                    <View style={styles.projectImages}>
                      <TouchableOpacity style={styles.projectImageWrapper}>
                        <Image source={{ uri: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&q=30' }} style={styles.projectImage} />
                        <View style={styles.projectBadge}><Text style={styles.projectBadgeText}>BEFORE</Text></View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.projectImageWrapper}>
                        <Image source={{ uri: 'https://images.unsplash.com/photo-1558211583-d28f610b15a0?w=300&q=30' }} style={styles.projectImage} />
                        <View style={[styles.projectBadge, styles.afterBadge]}><Text style={styles.projectBadgeText}>AFTER</Text></View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'Reviews' && (
            <View style={styles.reviewsTab}>
              {/* Rating Summary */}
              <View style={styles.reviewSummaryCard}>
                <View style={styles.ratingOverview}>
                  <Text style={styles.overallRatingLarge}>{provider.rating}</Text>
                  <View style={styles.starRowLarge}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons 
                        key={s} 
                        name={s <= Math.floor(provider.rating) ? 'star' : 'star-outline'} 
                        size={20} 
                        color="#FFD600" 
                      />
                    ))}
                  </View>
                  <Text style={styles.totalReviewsText}>{provider.reviewCount} reviews</Text>
                </View>
              </View>

              {/* Individual Reviews */}
              {isLoadingDetails && reviews.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00C853" />
                  <Text style={{ color: '#999', marginTop: 10 }}>Loading reviews...</Text>
                </View>
              ) : reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.user_profiles?.full_name || 'Verified User'}</Text>
                      <View style={styles.reviewMeta}>
                        <View style={styles.starRowSmall}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons 
                              key={s} 
                              name={s <= review.rating ? 'star' : 'star-outline'} 
                              size={14} 
                              color="#FFD600" 
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.reviewText}>{review.content}</Text>
                    
                    {review.image_url && (
                      <TouchableOpacity 
                        onPress={() => setSelectedImage(review.image_url)}
                        style={styles.reviewImageContainer}
                      >
                        <Image source={{ uri: `${review.image_url}?w=150&q=30` }} style={styles.reviewImage} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#999' }}>No reviews yet for this provider.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage} 
                resizeMode="contain" 
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Buttons */}
      <View style={styles.actionFooter}>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
          <Ionicons name="chatbubble-outline" size={20} color="#00C853" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNowPress}>
          <Ionicons name="calendar-outline" size={20} color="#fff" />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  heroSection: {
    height: 180,
    backgroundColor: '#00C853',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 200, 83, 0.4)',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#00C853',
    zIndex: 10,
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
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfoContainer: {
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  providerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1B1E',
    marginTop: 15,
  },
  badgeRow: {
    position: 'relative',
    flexDirection: 'row',
    marginTop: 20,
    top: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  verifiedBadge: { backgroundColor: '#00C853' },
  licensedBadge: { backgroundColor: '#4285F4' },
  insuredBadge: { backgroundColor: '#9061F9' },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: 74,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    margin: 7.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1B1E',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 15,
  },
  tabsScroll: {
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 15,
    marginRight: 30,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#00C853',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#00C853',
  },
  tabContent: {
    paddingBottom: 100,
  },
  aboutTab: {
    padding: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1B1E',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#495057',
  },
  licenseItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  licenseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  licenseNumber: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  certText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 10,
  },
  permitText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00C853',
    marginRight: 10,
  },
  messageButtonText: {
    color: '#00C853',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#00C853',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  servicesTab: {
    padding: 20,
  },
  serviceItemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  serviceItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1B1E',
  },
  serviceItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  serviceItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  dotSeparator: {
    marginHorizontal: 10,
    color: '#DDD',
  },
  serviceItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
  },
  addToBookingButton: {
    backgroundColor: '#00C853',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  addToBookingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  portfolioTab: {
    padding: 15,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  projectCard: {
    width: (width - 45) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  projectImages: {
    height: 200,
  },
  projectImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  projectBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  afterBadge: {
    backgroundColor: '#00C853',
  },
  projectBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  projectInfo: {
    padding: 10,
  },
  projectTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 16,
  },
  projectDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fullScreenImage: {
    width: width * 0.95,
    height: height * 0.7,
  },
  reviewsTab: {
    padding: 20,
  },
  reviewSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  ratingOverview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallRatingLarge: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1B1E',
  },
  starRowLarge: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  totalReviewsText: {
    fontSize: 12,
    color: '#999',
  },
  ratingBars: {
    flex: 2,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#666',
    width: 15,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA000',
  },
  ratingPercentage: {
    fontSize: 11,
    color: '#999',
    width: 30,
    textAlign: 'right',
  },
  reviewFilters: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  activeFilterChip: {
    backgroundColor: '#00C853',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1B1E',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starRowSmall: {
    flexDirection: 'row',
    marginRight: 10,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 15,
  },
  reviewServiceTag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  reviewServiceText: {
    fontSize: 12,
    color: '#666',
  },
  reviewImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  providerResponse: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  responseIndicator: {
    width: 4,
    backgroundColor: '#00C853',
    borderRadius: 2,
    marginRight: 12,
  },
  responseContent: {
    flex: 1,
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1B1E',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  helpfulText: {
    fontSize: 12,
    color: '#999',
  },
  loadMoreButton: {
    borderWidth: 1,
    borderColor: '#00C853',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadMoreText: {
    color: '#00C853',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
