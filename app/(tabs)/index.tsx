import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCustomerSession } from '@/lib/customer-session';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  {
    id: '1',
    title: 'Home Maintenance & Repair',
    icon: 'wrench',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E8F5E9',
    iconColor: '#2E7D32',
    services: 'Plumbing, Electrical, Carpentry, Painting, Other',
  },
  {
    id: '2',
    title: 'Beauty, Wellness & Personal Care',
    icon: 'flower',
    iconFamily: 'MaterialCommunityIcons',
    color: '#FCE4EC',
    iconColor: '#C2185B',
    services: 'Hair Styling, Makeup Artist, Massage, Nails, Other',
  },
  {
    id: '3',
    title: 'Education & Professional Services',
    icon: 'briefcase',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E8EAF6',
    iconColor: '#3F51B5',
    services: 'Academic Tutor, Language, Music Lessons, Other',
  },
  {
    id: '4',
    title: 'Domestic & Cleaning Services',
    icon: 'sparkles',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E3F2FD',
    iconColor: '#1976D2',
    services: 'House Cleaning, Laundry, Ironing, Deep Clean, Other',
  },
  {
    id: '5',
    title: 'Pet Services',
    icon: 'paw',
    iconFamily: 'MaterialCommunityIcons',
    color: '#FFF3E0',
    iconColor: '#EF6C00',
    services: 'Pet Grooming, Dog Walking, Pet Sitting, Other',
  },
  {
    id: '6',
    title: 'Events & Entertainment',
    icon: 'party-popper',
    iconFamily: 'MaterialCommunityIcons',
    color: '#F3E5F5',
    iconColor: '#7B1FA2',
    services: 'Photography, Hosting/MC, Catering, DJ/Music, Other',
  },
  {
    id: '7',
    title: 'Automotive & Tech Support',
    icon: 'car',
    iconFamily: 'MaterialCommunityIcons',
    color: '#F1F8E9',
    iconColor: '#558B2F',
    services: 'Car Repair, Car Wash, IT/Gadget Repair, Other',
  },
];

const RECENT_BOOKINGS = [
  {
    id: '1',
    service: 'Painting Service',
    provider: 'Carlos Fernandez',
    price: '₱3,500.00',
    initial: 'C',
    color: '#00C853',
  },
  {
    id: '2',
    service: 'Plumbing Service',
    provider: 'Lisa Martines',
    price: '₱1,200.00',
    initial: 'L',
    color: '#00C853',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { currentCustomer } = useCustomerSession();
  const firstName =
    currentCustomer?.profile?.fullName?.trim().split(/\s+/)[0] ||
    currentCustomer?.signupName?.trim().split(/\s+/)[0] ||
    'Customer';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View style={styles.profileContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={24} color="#fff" />
              </View>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.greetingText}>Good Afternoon</Text>
                <Text style={styles.userNameText}>{firstName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Search for services..."
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Book it again section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="history" size={18} color="#00C853" />
          <Text style={styles.sectionTitleSmall}>Book it again</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentBookingsScroll}>
          {RECENT_BOOKINGS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recentBookingCard}>
              <View style={[styles.bookingAvatar, { backgroundColor: item.color }]}>
                <Text style={styles.bookingInitialText}>{item.initial}</Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingServiceText}>{item.service}</Text>
                <Text style={styles.bookingProviderText}>{item.provider}</Text>
              </View>
              <Text style={styles.bookingPriceText}>{item.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Browse all categories section */}
        <View style={styles.categoriesHeader}>
          <Text style={styles.sectionTitle}>Browse all categories</Text>
          <Text style={styles.sectionSubtitle}>Find the right service for you</Text>
        </View>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push({
                pathname: '/category-details',
                params: { title: category.title, count: '8' }
              })}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                <MaterialCommunityIcons name={category.icon as any} size={24} color={category.iconColor} />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryServices} numberOfLines={2}>
                {category.services}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* More About ServEase section */}
        <View style={styles.moreHeader}>
          <Text style={styles.sectionTitle}>More About ServEase</Text>
          <Text style={styles.sectionSubtitle}>Your reliable partner for every service need.</Text>
        </View>

        {/* CTA Card */}
        <TouchableOpacity 
          style={styles.ctaCard}
          onPress={() => router.push('/provider-join' as any)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581578731522-745a05ad9ad5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhhbmR5bWFufGVufDB8fDB8fHww' }}
            style={styles.ctaImage}
          />
          <View style={styles.ctaBadgeContainer}>
            <View style={styles.ctaBadge}>
              <Ionicons name="settings-sharp" size={14} color="#fff" />
            </View>
          </View>
          <View style={styles.ctaContent}>
            <View style={styles.ctaTextRow}>
              <Text style={styles.ctaTitle}>Join the ServEase Team</Text>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </View>
            <Text style={styles.ctaDescription}>
              Turn your skills into earnings. Become a verified Service Provider today.
            </Text>
            <View style={styles.ctaButton}>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </View>
          </View>
        </TouchableOpacity>
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
    backgroundColor: '#00C853',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  welcomeTextContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    color: '#E0F2F1',
    fontSize: 12,
  },
  userNameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  recentBookingsScroll: {
    paddingLeft: 20,
  },
  recentBookingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bookingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingInitialText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingServiceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingProviderText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  bookingPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00C853',
  },
  categoriesHeader: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    width: (width - 45) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
  },
  categoryServices: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
    lineHeight: 16,
  },
  moreHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  ctaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  ctaImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  ctaBadgeContainer: {
    position: 'absolute',
    top: 130,
    right: 15,
  },
  ctaBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  ctaContent: {
    padding: 20,
  },
  ctaTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ctaDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
