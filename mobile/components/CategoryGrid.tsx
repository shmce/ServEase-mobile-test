import React, { memo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '@/constants/tokens';
import { ASSETS, UI_LABELS } from '@/constants/defaults';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 56) / 2; // (width - 40 parent padding - 16 gap) / 2

interface CategoryItem {
  id: string;
  name: string;
  icon_name?: string;
  image_url?: string;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  onPress: (name: string) => void;
}

const CategoryGridCard = memo(({ 
  category, 
  onPress 
}: { 
  category: CategoryItem; 
  onPress: (name: string) => void 
}) => {
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
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(category.name)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Image 
          source={{ uri: category.image_url || ASSETS.IMAGES.CATEGORY_FALLBACK }} 
          style={styles.cardImage} 
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {category.name}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.tagline}>{UI_LABELS.EXPLORE_SERVICES}</Text>
            <View style={styles.chevron}>
              <Ionicons name="arrow-forward" size={12} color={TOKENS.colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

CategoryGridCard.displayName = 'CategoryGridCard';

export const CategoryGrid = ({ categories, onPress }: CategoryGridProps) => {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <CategoryGridCard
          key={category.id}
          category={category}
          onPress={onPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  cardContainer: {
    width: COLUMN_WIDTH,
    marginBottom: 16,
  },
  card: {
    height: 180,
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.lg,
    shadowColor: TOKENS.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 100,
    backgroundColor: TOKENS.colors.background,
  },
  content: {
    flex: 1,
    padding: TOKENS.spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: TOKENS.colors.text.primary,
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.colors.primary,
  },
  chevron: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
