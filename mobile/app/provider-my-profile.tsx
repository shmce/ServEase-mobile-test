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

const PROFILE = {
  businessName: "Juan's Home Services",
  ownerName: 'Juan Dela Cruz',
  email: 'juanservices@email.com',
  phone: '+63 917 123 4567',
  address: '128 Kalayaan Ave, Makati City, Metro Manila',
  bio: 'Trusted home service provider focused on fast response times, clean workmanship, and reliable customer care for residential bookings.',
  experience: '8 years',
  serviceAreas: ['Makati City', 'Taguig City', 'Pasig City', 'Quezon City'],
  services: ['Plumbing', 'Electrical', 'Carpentry'],
  languages: ['English', 'Tagalog'],
  rating: '4.9',
  completedJobs: '248',
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={18} color="#00B761" />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const TagList = ({ items }: { items: string[] }) => (
  <View style={styles.tagsWrap}>
    {items.map((item) => (
      <View key={item} style={styles.tag}>
        <Text style={styles.tagText}>{item}</Text>
      </View>
    ))}
  </View>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function ProviderMyProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/provider-edit-profile' as any)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.businessName}>{PROFILE.businessName}</Text>
          <Text style={styles.ownerName}>{PROFILE.ownerName}</Text>

          <View style={styles.statsRow}>
            <StatCard label="Rating" value={PROFILE.rating} />
            <StatCard label="Completed Jobs" value={PROFILE.completedJobs} />
            <StatCard label="Experience" value={PROFILE.experience} />
          </View>
        </View>

        <Section title="Contact Information">
          <DetailRow icon="mail-outline" label="Email" value={PROFILE.email} />
          <DetailRow icon="call-outline" label="Phone" value={PROFILE.phone} />
          <DetailRow icon="location-outline" label="Address" value={PROFILE.address} />
        </Section>

        <Section title="About">
          <Text style={styles.bioText}>{PROFILE.bio}</Text>
        </Section>

        <Section title="Service Details">
          <Text style={styles.subsectionLabel}>Services Offered</Text>
          <TagList items={PROFILE.services} />

          <Text style={styles.subsectionLabel}>Service Areas</Text>
          <TagList items={PROFILE.serviceAreas} />

          <Text style={styles.subsectionLabel}>Languages</Text>
          <TagList items={PROFILE.languages} />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00B761',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00B761',
  },
  businessName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D1B2A',
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0D1B2A',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  subsectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  tag: {
    backgroundColor: '#E8FBF2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B761',
  },
});
