import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORY_STYLE_MAP: Record<string, any> = {
  'Home Maintenance & Repair': {
    icon: 'wrench',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E8F5E9',
    iconColor: '#2E7D32',
  },
  'Beauty, Wellness & Personal Care': {
    icon: 'flower',
    iconFamily: 'MaterialCommunityIcons',
    color: '#FCE4EC',
    iconColor: '#C2185B',
  },
  'Education & Professional Services': {
    icon: 'briefcase',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E8EAF6',
    iconColor: '#3F51B5',
  },
  'Domestic & Cleaning Services': {
    icon: 'broom',
    iconFamily: 'MaterialCommunityIcons',
    color: '#E3F2FD',
    iconColor: '#1976D2',
  },
  'Pet Services': {
    icon: 'paw',
    iconFamily: 'MaterialCommunityIcons',
    color: '#FFF3E0',
    iconColor: '#EF6C00',
  },
  'Events & Entertainment': {
    icon: 'party-popper',
    iconFamily: 'MaterialCommunityIcons',
    color: '#F3E5F5',
    iconColor: '#7B1FA2',
  },
  'Automotive & Tech Support': {
    icon: 'car',
    iconFamily: 'MaterialCommunityIcons',
    color: '#F1F8E9',
    iconColor: '#558B2F',
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Customer';

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      // Fetch dynamic categories from Services
      const { data: servicesData } = await supabase
        .from('services')
        .select('category, title');

      if (servicesData) {
        // Group services by category
        const categoryMap = new Map();
        servicesData.forEach((s: any) => {
          if (!s.category) return;
          if (!categoryMap.has(s.category)) {
            categoryMap.set(s.category, []);
          }
          categoryMap.get(s.category).push(s.title);
        });

        const allCategories = Object.keys(CATEGORY_STYLE_MAP).map((catName, index) => {
          const style = CATEGORY_STYLE_MAP[catName];
          let servicesText = 'Coming soon...';
          
          if (categoryMap.has(catName) && categoryMap.get(catName).length > 0) {
            const uniqueServices = Array.from(new Set(categoryMap.get(catName))).slice(0, 4).join(', ');
            servicesText = uniqueServices + (categoryMap.get(catName).length > 4 ? ', Other' : '');
          }

          return {
            id: String(index + 1),
            title: catName,
            icon: style.icon,
            iconFamily: style.iconFamily,
            color: style.color,
            iconColor: style.iconColor,
            services: servicesText,
          };
        });
        setCategories(allCategories);
      }

      // Fetch recent bookings
      if (user) {
        const { data: bookData } = await supabase
          .from('bookings')
          .select(`
            *,
            provider:provider_profiles(user_profiles(full_name, avatar_url))
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookData) {
          setRecentBookings(bookData.map(b => ({
            id: b.id,
            service: b.service_name,
            provider: b.provider?.user_profiles?.full_name || 'Service Provider',
            price: `₱${(b.total_price || 0).toLocaleString()}`,
            initial: (b.provider?.user_profiles?.full_name || 'P').charAt(0),
            color: '#00C853',
            date: new Date(b.scheduled_at || b.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            time: new Date(b.scheduled_at || b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        }
      }
      setIsLoading(false);
    }

    fetchData();
  }, [user]);

  const handleBookAgain = (booking: any) => {
    router.push({
      pathname: '/customer-book-again',
      params: {
        booking: JSON.stringify({
          ...booking,
          providerName: booking.provider,
        }),
      },
    } as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

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
          {recentBookings.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentBookingCard}
              onPress={() => handleBookAgain(item)}
              activeOpacity={0.85}
            >
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
          {categories.map((category: any) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push({
                pathname: '/category-details',
                params: { title: category.title, count: String(category.services.split(',').length) }
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
            source={require('../../assets/images/cta-join-team.png')}
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
