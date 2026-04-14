import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Animated,
  Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getErrorMessage } from '@/lib/error-handling';
import { getServicesByCategoryName } from '@/services/marketplaceService';
import { findCategoryGroup, findParentCategoryForSubcategory, getSubcategoryImage } from '@/constants/service-taxonomy';
import { TOKENS } from '@/constants/tokens';
import { ASSETS, UI_LABELS } from '@/constants/defaults';
import { formatCurrency } from '@/lib/formatters';

const { width } = Dimensions.get('window');

const InteractiveCard = ({ children, onPress, style }: { children: React.ReactNode, onPress: () => void, style?: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { title = 'Home Maintenance' } = useLocalSearchParams<{ title: string }>();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const matchingGroup = findCategoryGroup(title);
    if (matchingGroup) {
      setServices([]);
      setError('');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const rows = await getServicesByCategoryName(title);
        if (mounted) setServices(rows);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load services.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [title]);

  const categoryGroup = findCategoryGroup(title);
  const parentGroup = findParentCategoryForSubcategory(title);

  return (
    <View style={styles.container}>
      {/* Use light status bar when on dark hero image */}
      <StatusBar style="light" />
      
      {/* Subcategory Full-Width Hero Banner */}
      {categoryGroup ? (
        <View style={styles.heroWrapper}>
          <Image 
            source={{ uri: categoryGroup.image_url || ASSETS.IMAGES.HERO_FALLBACK }} 
            style={styles.heroImage} 
          />
          {/* Gradient Overlay for Text Legibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.heroOverlay}
          />
          <Text style={styles.heroTextOverlay}>{categoryGroup.name}</Text>
          {categoryGroup.subcategories && (
            <Text style={styles.heroSubTextOverlay}>{categoryGroup.subcategories.length} sub-categories available</Text>
          )}
        </View>
      ) : (
        <View style={styles.heroWrapper}>
          <Image 
            source={{ uri: getSubcategoryImage(title) }} 
            style={styles.heroImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.heroOverlay}
          />
          <Text style={styles.heroTextOverlay}>{title}</Text>
          <Text style={styles.heroSubTextOverlay}>{services.length} services found</Text>
        </View>
      )}

      {/* Absolute Floating Back Button */}
      <View style={[styles.floatingHeader, { top: Math.max(insets.top, 20) }]}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} 
          style={styles.floatingBackButton}
        >
          <Ionicons name="chevron-back" size={24} color={TOKENS.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView bounces={true} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        <View style={[styles.scrollContent, { paddingTop: categoryGroup ? 300 : Math.max(insets.top, 20) + 120 }]}>
          {parentGroup && (
            <View style={styles.breadcrumb}>
              <Text style={styles.parentLabel}>{parentGroup.name}</Text>
              <Ionicons name="chevron-forward" size={10} color={TOKENS.colors.text.muted} style={{ marginHorizontal: 4 }} />
              <Text style={[styles.parentLabel, { color: TOKENS.colors.text.muted }]}>{title}</Text>
            </View>
          )}

          {isLoading && <ActivityIndicator size="large" color={TOKENS.colors.primary} style={{ marginTop: 40 }} />}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {!categoryGroup && !isLoading && !error && services.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={TOKENS.colors.background} />
              <Text style={styles.emptyText}>No services found in this category.</Text>
            </View>
          )}

          {/* Subcategories - 1 Column List Tiles */}
          {categoryGroup && (
            <View style={styles.listContainer}>
              {categoryGroup.subcategories.map((subcategory) => (
                <InteractiveCard
                  key={subcategory}
                  style={{ width: '100%', marginBottom: 16 }}
                  onPress={() =>
                    router.push({
                      pathname: '/provider-list',
                      params: { serviceName: subcategory },
                    })
                  }
                >
                  <View style={styles.listCard}>
                    <Image source={{ uri: getSubcategoryImage(subcategory) }} style={styles.listCardImage} />
                    <View style={styles.listCardContent}>
                      <Text style={styles.listTitle} numberOfLines={2}>{subcategory}</Text>
                      <View style={styles.listFooterRow}>
                        <Text style={styles.listHint}>{UI_LABELS.EXPLORE_SERVICES}</Text>
                        <View style={styles.listChevron}>
                          <Ionicons name="arrow-forward" size={14} color={TOKENS.colors.primary} />
                        </View>
                      </View>
                    </View>
                  </View>
                </InteractiveCard>
              ))}
            </View>
          )}

          {/* Services - Single Column List with Thumbnails */}
          {services.map((service) => (
            <InteractiveCard
              key={service.id}
              style={{ width: '100%', marginBottom: 12 }}
              onPress={() =>
                router.push({
                  pathname: '/provider-list',
                  params: { serviceName: service.title },
                })
              }
            >
              <View style={styles.serviceCard}>
                <Image source={{ uri: getSubcategoryImage(title) }} style={styles.serviceThumbnail} />
                <View style={[styles.serviceInfo, { flex: 1, marginLeft: 16, marginBottom: 0 }]}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description || 'Professional services tailored to your needs.'}
                    </Text>
                    <View style={styles.serviceFooterAlt}>
                        <View style={styles.priceTag}>
                            <Text style={styles.fromText}>{UI_LABELS.FROM_PRICE}</Text>
                            <Text style={styles.priceText}>{formatCurrency(service.price)}</Text>
                        </View>
                        <View style={styles.actionBtnAlt}>
                            <Ionicons name="arrow-forward" size={12} color="#fff" />
                        </View>
                    </View>
                </View>
              </View>
            </InteractiveCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: TOKENS.colors.background 
  },
  floatingHeader: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  floatingBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContainer: { 
    paddingBottom: 60,
  },
  scrollContent: { 
    padding: 20,
  },
  heroWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: TOKENS.colors.background,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubTextOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroWrapperFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: TOKENS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.border,
    zIndex: 5,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTextFallback: {
    fontSize: 28, 
    fontWeight: '900', 
    color: TOKENS.colors.text.primary,
    letterSpacing: -0.5,
  },
  heroSubTextFallback: {
    fontSize: 14, 
    color: TOKENS.colors.text.secondary, 
    marginTop: 6,
    fontWeight: '600',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  parentLabel: { 
    fontSize: 11, 
    color: TOKENS.colors.primary, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    marginTop: 4,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: TOKENS.colors.surface,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: TOKENS.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
  },
  listCardImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: TOKENS.colors.background,
  },
  listCardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  listTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: TOKENS.colors.text.primary,
    lineHeight: 22,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  listFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHint: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.colors.primary,
  },
  listChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCard: { 
    flexDirection: 'row',
    backgroundColor: TOKENS.colors.surface, 
    borderRadius: 24, 
    padding: 12,
    alignItems: 'center',
    shadowColor: TOKENS.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
  },
  serviceThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: TOKENS.colors.background,
  },
  serviceInfo: {
    marginBottom: 0,
  },
  serviceTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: TOKENS.colors.text.primary,
    marginBottom: 4,
  },
  serviceDescription: { 
    fontSize: 12, 
    color: TOKENS.colors.text.secondary, 
    lineHeight: 16,
    marginBottom: 8,
  },
  serviceFooterAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.background,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  fromText: {
    fontSize: 10,
    color: TOKENS.colors.text.muted,
    fontWeight: '600',
    marginBottom: 2,
    marginRight: 4,
  },
  priceText: { 
    fontSize: 16, 
    color: TOKENS.colors.primary, 
    fontWeight: '800',
  },
  actionBtnAlt: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: TOKENS.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: { 
    textAlign: 'center', 
    color: TOKENS.colors.text.secondary, 
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: { 
    textAlign: 'center', 
    color: TOKENS.colors.danger.text, 
    marginTop: 24,
    fontWeight: '500',
  },
});
