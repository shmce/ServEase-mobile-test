import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 16px padding on sides + 16px gap

interface CategoryItem {
  id: string;
  name: string;
  icon_name?: string;
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
  // Map icon names from DB to Ionicons, with fallback
  const iconName = (category.icon_name || 'apps-outline') as any;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(category.name)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={28} color="#00B761" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.subtitle}>Explore services</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
});

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
    gap: 16,
    paddingHorizontal: 4,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F7FFF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  subtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chevronContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
