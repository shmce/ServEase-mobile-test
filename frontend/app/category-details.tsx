import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type Service = {
  id: string;
  title: string;
  description: string;
  price: string;
  image: string;
};

// Memoized service card for efficient rendering
const ServiceCard = React.memo(({ service, onPress }: { service: Service; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.serviceCard}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Image 
      source={{ uri: service.image }}
      style={styles.serviceImage}
    />
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceTitle} numberOfLines={2}>{service.title}</Text>
      <Text style={styles.serviceDescription} numberOfLines={2}>
        {service.description}
      </Text>
      <Text style={styles.servicePrice}>From ₱{service.price}</Text>
    </View>
  </TouchableOpacity>
));

ServiceCard.displayName = 'ServiceCard';

// Optimized images with reduced quality for faster loading
const CATEGORY_HEROES: Record<string, { image: string; description: string }> = {
  'Home Maintenance & Repair': {
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&h=300&q=30&fit=crop',
    description: "Expert plumbing, electrical, and structural repairs for your home.",
  },
  'Beauty, Wellness & Personal Care': {
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&q=30&fit=crop',
    description: "Professional spa, salon, and wellness services at your doorstep.",
  },
  'Education & Professional Services': {
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=300&q=30&fit=crop',
    description: "Academic tutoring, music lessons, and professional consulting.",
  },
  'Domestic & Cleaning Services': {
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=300&q=30&fit=crop',
    description: "Sparkling clean homes with our professional domestic services.",
  },
  'Pet Services': {
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=300&h=300&q=30&fit=crop',
    description: "Compassionate grooming, walking, and sitting for your furry friends.",
  },
  'Events & Entertainment': {
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=300&q=30&fit=crop',
    description: "Unforgettable celebrations with expert planning and entertainment.",
  },
  'Automotive & Tech Support': {
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=300&q=30&fit=crop',
    description: "Expert car repairs and reliable tech support for your gadgets.",
  }
};


export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { title = 'Home Maintenance & Repair' } = useLocalSearchParams<{ title: string }>();

  const [services, setServices] = useState<Service[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { finalHeroImage, heroDescription } = useMemo(() => {
    return {
      finalHeroImage: CATEGORY_HEROES[title]?.image || CATEGORY_HEROES['Home Maintenance & Repair'].image,
      heroDescription: CATEGORY_HEROES[title]?.description || "Browse our verified providers.",
    };
  }, [title]);

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', title);
        
      if (data) {
        // Group distinct services by title
        const uniqueTitles = new Set();
        const deduped: Service[] = [];
        data.forEach((item: any) => {
          if (!uniqueTitles.has(item.title)) {
            uniqueTitles.add(item.title);
            deduped.push({
              id: item.id,
              title: item.title,
              description: item.description || 'Professional service',
              price: item.starting_price ? String(item.starting_price) : 'Contact for price',
              image: CATEGORY_HEROES[title]?.image || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&q=30',
            });
          }
        });
        setServices(deduped);
        setCount(deduped.length);
      }
      setIsLoading(false);
    }
    fetchServices();
  }, [title]);

  const handleServicePress = useCallback((service: Service) => {
    router.push({
      pathname: '/provider-list',
      params: { 
        serviceName: service.title,
        serviceImage: service.image,
      },
    });
  }, [router]);

  const renderServiceItem = useCallback(({ item }: { item: Service }) => (
    <ServiceCard 
      service={item} 
      onPress={() => handleServicePress(item)} 
    />
  ), [handleServicePress]);

  const renderHeader = useCallback(() => <View style={styles.heroSpacer} />, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        windowSize={10}
      />

      <View style={styles.absoluteHeroContainer} pointerEvents="none">
        <ImageBackground 
          source={{ uri: finalHeroImage }}
          style={styles.heroBackground}
          progressiveRenderingEnabled={true}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroSubtitle}>{heroDescription}</Text>
              <View style={styles.badge}>
                <Ionicons name="flash" size={12} color="#00C853" />
                <Text style={styles.badgeText}>{count} services</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  flatListContent: { paddingBottom: 30 },
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
  heroBackground: { flex: 1, width: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  heroSpacer: { height: 320 },
  heroInfo: { marginBottom: 0 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 8, lineHeight: 20, maxWidth: '90%' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  navHeader: { position: 'absolute', top: 5, left: 0, zIndex: 30, paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  serviceImage: { width: 100, height: 100, backgroundColor: '#f0f0f0' },
  serviceInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  serviceTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  serviceDescription: { fontSize: 12, color: '#666', marginBottom: 8 },
  servicePrice: { fontSize: 13, fontWeight: '700', color: '#00C853' },
});
