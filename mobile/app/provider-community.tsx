import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const COMMUNITY_ITEMS = [
  {
    title: 'Provider Tips & Guides',
    subtitle: 'Best practices to improve ratings, response time, and repeat bookings.',
    icon: 'book-outline',
  },
  {
    title: 'Local Provider Meetups',
    subtitle: 'Join monthly community sessions and skills workshops near you.',
    icon: 'people-outline',
  },
  {
    title: 'Announcements',
    subtitle: 'Stay updated on product changes, promos, and platform improvements.',
    icon: 'megaphone-outline',
  },
];

export default function ProviderCommunityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Community</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Connect with other ServEase providers, learn from new resources, and keep up with community updates.
        </Text>

        {COMMUNITY_ITEMS.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={22} color="#00B761" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/provider-contact-support' as any)}>
          <Text style={styles.primaryButtonText}>Ask Community Team</Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0D1B2A', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, lineHeight: 20, color: '#6B7280' },
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
