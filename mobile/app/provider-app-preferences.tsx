import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const OPTIONS = {
  language: ['English', 'Tagalog'],
  currency: ['PHP (₱)', 'USD ($)'],
  distance: ['Kilometers', 'Miles'],
} as const;

function OptionGroup({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: readonly string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity key={item} style={[styles.optionRow, index > 0 && styles.optionRowBorder]} onPress={() => onSelect(item)}>
          <Text style={styles.optionLabel}>{item}</Text>
          {selected === item ? (
            <Ionicons name="checkmark-circle" size={22} color="#00B761" />
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProviderAppPreferencesScreen() {
  const router = useRouter();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('PHP (₱)');
  const [distance, setDistance] = useState('Kilometers');

  const intro = useMemo(() => {
    if (focus === 'currency') return 'Choose how pricing values appear across your provider dashboard.';
    if (focus === 'distance') return 'Choose the distance unit used in travel estimates and service areas.';
    return 'Customize how language, money, and distances appear throughout the provider app.';
  }, [focus]);

  const handleSave = () => {
    Alert.alert('Preferences Saved', 'Your app preferences have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>{intro}</Text>

        <OptionGroup title="Language" items={OPTIONS.language} selected={language} onSelect={setLanguage} />
        <OptionGroup title="Currency" items={OPTIONS.currency} selected={currency} onSelect={setCurrency} />
        <OptionGroup title="Distance Unit" items={OPTIONS.distance} selected={distance} onSelect={setDistance} />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  description: { fontSize: 15, lineHeight: 22, color: '#555', marginBottom: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  groupTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A', paddingTop: 16, paddingBottom: 6 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionRowBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  optionLabel: { fontSize: 15, fontWeight: '500', color: '#0D1B2A' },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
