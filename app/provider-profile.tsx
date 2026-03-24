import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const TABS = ['About', 'Services', 'Portfolio', 'Reviews'];

export default function ProviderProfileScreen() {
  const router = useRouter();
  const {
    providerId = '1',
    serviceName = 'Electrical Services',
    providerName,
  } = useLocalSearchParams<{
    providerId: string;
    serviceName?: string;
    providerName?: string;
  }>();
  const [activeTab, setActiveTab] = useState('About');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const provider = {
    name: providerName || 'Carlos Mendoza',
    rating: 4.9,
    reviewCount: 267,
    bookings: 1245,
    experience: '8+',
    bio: 'Professional electrician with over 8 years of experience in residential and commercial electrical work. Certified master electrician specializing in installations, repairs, and maintenance. Committed to delivering high-quality service with attention to safety and customer satisfaction.',
    categories: ['Electrical Services', 'Home Repairs', 'Installation'],
    areas: ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig'],
    languages: ['English', 'Tagalog', 'Cebuano'],
    licenses: [
      { title: 'Master Electrician License', number: 'PRC-ME-20150234' },
      { title: 'Electrical Contractor License', number: 'PEEC-2016-0892' },
    ],
    certifications: [
      'Advanced Electrical Systems Training',
      'Solar Panel Installation Certified',
      'Industrial Wiring Specialist',
    ],
    services: [
      {
        id: 's1',
        title: 'Electrical Installation',
        description: 'Complete electrical wiring for new constructions and renovations',
        duration: '4-8 hours',
        price: '2,500',
      },
      {
        id: 's2',
        title: 'Circuit Breaker Repair',
        description: 'Diagnosis and repair of electrical panel and circuit breakers',
        duration: '2-3 hours',
        price: '1,200',
      },
      {
        id: 's3',
        title: 'Lighting Installation',
        description: 'Installation of ceiling lights, chandeliers, and outdoor lighting',
        duration: '1-2 hours',
        price: '800',
      },
      {
        id: 's4',
        title: 'Electrical Troubleshooting',
        description: 'Identify and fix electrical issues in residential properties',
        duration: '1-3 hours',
        price: '1,000',
      },
    ],
    portfolio: [
      {
        id: 'p1',
        title: 'Complete home rewiring and modern lighting installation',
        date: 'February 2024',
        before: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=60',
        after: 'https://images.unsplash.com/photo-1558211583-d28f610b15a0?w=400&auto=format&fit=crop&q=60',
      },
      {
        id: 'p2',
        title: 'Commercial electrical panel upgrade',
        date: 'January 2024',
        before: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=60',
        after: 'https://images.unsplash.com/photo-1565608444338-316f39f20b43?w=400&auto=format&fit=crop&q=60',
      },
      {
        id: 'p3',
        title: 'Outdoor lighting system installation',
        date: 'December 2023',
        before: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5db?w=400&auto=format&fit=crop&q=60',
        after: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&auto=format&fit=crop&q=60',
      },
      {
        id: 'p4',
        title: 'Emergency electrical repair and restoration',
        date: 'November 2023',
        before: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&auto=format&fit=crop&q=60',
        after: 'https://images.unsplash.com/photo-1558211583-032d84db863c?w=400&auto=format&fit=crop&q=60',
      },
    ],
    ratingDistribution: [
      { stars: 5, percentage: 80 },
      { stars: 4, percentage: 20 },
      { stars: 3, percentage: 0 },
      { stars: 2, percentage: 0 },
      { stars: 1, percentage: 0 },
    ],
    reviews: [
      {
        id: 'r1',
        userName: 'M***a R.',
        rating: 5,
        date: 'March 10, 2024',
        text: 'Carlos did an excellent job installing our new lighting fixtures. Very professional and cleaned up after the work. Highly recommended!',
        serviceName: 'Lighting Installation',
        image: 'https://images.unsplash.com/photo-1565608444338-316f39f20b43?w=400&auto=format&fit=crop&q=60',
        response: 'Thank you for the kind words! It was a pleasure working with you.',
        helpfulCount: 12,
      },
      {
        id: 'r2',
        userName: 'J***n T.',
        rating: 5,
        date: 'March 5, 2024',
        text: 'Fast response and fixed our electrical issue quickly. Very knowledgeable and explained everything clearly.',
        serviceName: 'Electrical Troubleshooting',
        response: 'Glad I could help! Don\'t hesitate to reach out if you need anything else.',
        helpfulCount: 8,
      },
      {
        id: 'r3',
        userName: 'L***a S.',
        rating: 4,
        date: 'February 28, 2024',
        text: 'Good service overall. Arrived on time and completed the work as promised. Would use again.',
        serviceName: 'Circuit Breaker Repair',
        helpfulCount: 5,
      },
    ],
    permit: 'Manila-2024-BP-45678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
    banner: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=60',
  };

  const handleMessagePress = () => {
    router.push({
      pathname: '/customer-chat',
      params: {
        id: providerId,
        providerId,
        providerName: provider.name,
        serviceName,
      },
    });
  };

  const handleBookNowPress = () => {
    router.push({
      pathname: '/customer-booking-form',
      params: {
        providerId,
        providerName: provider.name,
        serviceName,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: provider.banner }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay} />
          
          <SafeAreaView style={styles.headerNav}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Provider Profile</Text>
            <View style={{ width: 40 }} />
          </SafeAreaView>

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Service Categories</Text>
                <View style={styles.tagRow}>
                  {provider.categories.map((cat) => (
                    <View key={cat} style={styles.tag}>
                      <Text style={styles.tagText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Service Areas */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="location-outline" size={20} color="#00C853" />
                  <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Service Areas</Text>
                </View>
                <View style={styles.tagRow}>
                  {provider.areas.map((area) => (
                    <View key={area} style={styles.tag}>
                      <Text style={styles.tagText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Languages */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons name="translate" size={20} color="#00C853" />
                  <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Languages</Text>
                </View>
                <View style={styles.tagRow}>
                  {provider.languages.map((lang) => (
                    <View key={lang} style={styles.tag}>
                      <Text style={styles.tagText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Licenses */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="ribbon-outline" size={20} color="#00C853" />
                  <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Professional Licenses</Text>
                </View>
                {provider.licenses.map((license, idx) => (
                  <View key={idx} style={styles.licenseItem}>
                    <Text style={styles.licenseTitle}>{license.title}</Text>
                    <Text style={styles.licenseNumber}>License #: {license.number}</Text>
                  </View>
                ))}
              </View>

              {/* Certifications */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#00C853" />
                  <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Certifications</Text>
                </View>
                {provider.certifications.map((cert) => (
                  <View key={cert} style={styles.certItem}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#00C853" />
                    <Text style={styles.certText}>{cert}</Text>
                  </View>
                ))}
              </View>

              {/* Business Permit */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="document-outline" size={20} color="#00C853" />
                  <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Business Permit</Text>
                </View>
                <Text style={styles.permitText}>Permit #: {provider.permit}</Text>
              </View>
            </View>
          )}

          {activeTab === 'Services' && (
            <View style={styles.servicesTab}>
              {provider.services.map((service) => (
                <View key={service.id} style={styles.serviceItemCard}>
                  <Text style={styles.serviceItemTitle}>{service.title}</Text>
                  <Text style={styles.serviceItemDescription}>{service.description}</Text>
                  <View style={styles.serviceItemDetails}>
                    <View style={styles.durationRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.durationText}>{service.duration}</Text>
                    </View>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.serviceItemPrice}>₱{service.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.addToBookingButton}>
                    <Text style={styles.addToBookingText}>Add to Booking</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Portfolio' && (
            <View style={styles.portfolioTab}>
              <View style={styles.portfolioGrid}>
                {provider.portfolio.map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <View style={styles.projectImages}>
                      <TouchableOpacity 
                        style={styles.projectImageWrapper} 
                        onPress={() => setSelectedImage(project.before)}
                      >
                        <Image source={{ uri: project.before }} style={styles.projectImage} />
                        <View style={styles.projectBadge}>
                          <Text style={styles.projectBadgeText}>BEFORE</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.projectImageWrapper} 
                        onPress={() => setSelectedImage(project.after)}
                      >
                        <Image source={{ uri: project.after }} style={styles.projectImage} />
                        <View style={[styles.projectBadge, styles.afterBadge]}>
                          <Text style={styles.projectBadgeText}>AFTER</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectTitle} numberOfLines={2}>
                        {project.title}
                      </Text>
                      <Text style={styles.projectDate}>{project.date}</Text>
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
                <View style={styles.ratingBars}>
                  {provider.ratingDistribution.map((dist) => (
                    <View key={dist.stars} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{dist.stars}</Text>
                      <Ionicons name="star" size={12} color="#FFD600" />
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${dist.percentage}%` }]} />
                      </View>
                      <Text style={styles.ratingPercentage}>{dist.percentage}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewFilters}>
                {['All', 'Recent', 'High Rating', 'Low Rating'].map((filter) => (
                  <TouchableOpacity 
                    key={filter} 
                    style={[styles.filterChip, filter === 'All' && styles.activeFilterChip]}
                  >
                    <Text style={[styles.filterChipText, filter === 'All' && styles.activeFilterChipText]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Individual Reviews */}
              {provider.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
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
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.reviewText}>{review.text}</Text>
                  
                  <View style={styles.reviewServiceTag}>
                    <Text style={styles.reviewServiceText}>{review.serviceName}</Text>
                  </View>

                  {review.image && (
                    <TouchableOpacity 
                      onPress={() => setSelectedImage(review.image)}
                      style={styles.reviewImageContainer}
                    >
                      <Image source={{ uri: review.image }} style={styles.reviewImage} />
                    </TouchableOpacity>
                  )}

                  {review.response && (
                    <View style={styles.providerResponse}>
                      <View style={styles.responseIndicator} />
                      <View style={styles.responseContent}>
                        <Text style={styles.responseLabel}>Provider Response</Text>
                        <Text style={styles.responseText}>{review.response}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.reviewFooter}>
                    <Text style={styles.helpfulText}>{review.helpfulCount} people found this helpful</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.loadMoreButton}>
                <Text style={styles.loadMoreText}>Load More Reviews</Text>
              </TouchableOpacity>
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
    height: 320,
    backgroundColor: '#00C853',
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
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
    paddingRight: 20,
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
