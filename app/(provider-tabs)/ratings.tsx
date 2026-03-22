import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const RatingDistribution = () => {
  const distribution = [
    { stars: 5, percentage: 85, color: '#00B761' },
    { stars: 4, percentage: 10, color: '#00B761' },
    { stars: 3, percentage: 3, color: '#00B761' },
    { stars: 2, percentage: 1, color: '#00B761' },
    { stars: 1, percentage: 1, color: '#00B761' },
  ];

  return (
    <View style={styles.distributionContainer}>
      {distribution.map((item) => (
        <View key={item.stars} style={styles.distributionRow}>
          <Text style={styles.starLabel}>{item.stars}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
      <Text style={styles.verifiedCount}>Based on 148 verified services</Text>
    </View>
  );
};

const ReviewItem = ({ avatar, name, date, rating, comment, tags }: any) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Image source={{ uri: avatar }} style={styles.reviewerAvatar} />
      <View style={styles.reviewerInfo}>
        <Text style={styles.reviewerName}>{name}</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons 
              key={s} 
              name={s <= rating ? "star" : "star-outline"} 
              size={14} 
              color="#00B761" 
              style={{ marginRight: 2 }} 
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewDate}>{date}</Text>
    </View>
    <Text style={styles.reviewComment}>{comment}</Text>
    <View style={styles.tagRow}>
      {tags.map((tag: string, index: number) => (
        <View key={index} style={styles.tagPill}>
          <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function RatingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All Reviews');

  const reviews = [
    {
      avatar: 'https://i.pravatar.cc/150?u=julian',
      name: 'Julian Thorne',
      date: 'OCT 24, 2023',
      rating: 5,
      comment: 'Exceeded all expectations. The level of detail provided in the final report was exceptional. They clearly understood the nuances of the task and delivered 2 days ahead of schedule. Highly recommended for any high-stakes professional requirements.',
      tags: ['Premium Consultation'],
    },
    {
      avatar: 'https://i.pravatar.cc/150?u=elena',
      name: 'Elena Rodriguez',
      date: 'OCT 18, 2023',
      rating: 4,
      comment: 'Very reliable and communicative throughout the process. The service was professional and well-executed. Only reason for 4 stars is a minor clerical error in the initial draft, which was fixed immediately after I flagged it.',
      tags: ['Standard Audit'],
    },
    {
      avatar: 'https://i.pravatar.cc/150?u=marcus',
      name: 'Marcus Chen',
      date: 'OCT 12, 2023',
      rating: 5,
      comment: 'Consistently the best provider on this platform. This is my fourth time booking them and they have never missed a beat. If you need absolute precision and professionalism, this is the partner for you.',
      tags: ['Enterprise Plan', 'Verified Repeat'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00B761" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Ledger</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#00B761" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Cumulative Reputation */}
        <View style={styles.reputationSection}>
          <Text style={styles.sectionLabel}>CUMULATIVE REPUTATION</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>4.9</Text>
            <Text style={styles.ratingMax}> / 5.0</Text>
          </View>

          <View style={styles.distributionCard}>
            <RatingDistribution />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['All Reviews', 'Recent', 'With Photos'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviews.map((review, index) => (
            <ReviewItem key={index} {...review} />
          ))}
        </View>

        <TouchableOpacity style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>Show more reviews</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Outfit-Bold',
  },
  notificationButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  reputationSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  ratingValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: 'Outfit-Bold',
  },
  ratingMax: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: 'Outfit-Bold',
  },
  distributionCard: {
    backgroundColor: '#F3F4F640',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  distributionContainer: {
    width: '100%',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 20,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginLeft: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  verifiedCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#00B761',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  reviewsList: {
    paddingHorizontal: 24,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  starRow: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#00B76115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00B761',
    letterSpacing: 0.5,
  },
  showMoreButton: {
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B761',
  },
  footerSpacer: {
    height: 40,
  },
});
