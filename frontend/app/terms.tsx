import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const termsSections = [
  {
    number: '1',
    title: 'Acceptance of Terms',
    body: [
      'By downloading, accessing, or using ServEase, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the app.',
    ],
  },
  {
    number: '2',
    title: 'About ServEase',
    body: [
      'ServEase is a Philippine-based service marketplace that connects customers with independent service workers across the following categories:',
    ],
    bullets: [
      'Home Maintenance and Repair',
      'Beauty, Wellness & Personal Care',
      'Education & Professional Services',
      'Domestic & Cleaning Services',
      'Pet Services',
      'Events & Entertainment',
      'Automotive & Tech Support',
    ],
  },
  {
    number: '3',
    title: 'User Accounts',
    bullets: [
      'You must provide accurate and complete information during registration.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You must be at least 18 years old to use ServEase.',
      'ServEase reserves the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    number: '4',
    title: 'Service Workers',
    bullets: [
      'Service workers are independent contractors, not employees of ServEase.',
      'ServEase does not guarantee the quality, safety, or legality of services offered.',
      'Workers must complete identity verification before being approved on the platform.',
      'ServEase reserves the right to remove any worker who violates platform policies.',
    ],
  },
  {
    number: '5',
    title: 'Bookings & Payments',
    bullets: [
      'Customers agree to pay the agreed service fee upon booking confirmation.',
      "Additional transportation fees may apply if the service location is beyond the worker's set service radius.",
      'Cancellations must be made within the allowed cancellation window stated at booking time.',
    ],
  },
  {
    number: '6',
    title: 'Transportation Fee Policy',
    body: [
      "If a customer's location is beyond the service worker's maximum service radius, an additional transportation fee will be calculated and added to the total booking cost. This fee will be clearly shown before booking confirmation.",
    ],
  },
  {
    number: '7',
    title: 'Prohibited Activities',
    body: ['Users must not:'],
    bullets: [
      'Use ServEase for any illegal or unauthorized purpose.',
      'Harass, abuse, or harm other users or service workers.',
      'Post false, misleading, or fraudulent information.',
      "Attempt to bypass or manipulate the platform's systems.",
    ],
  },
  {
    number: '8',
    title: 'Limitation of Liability',
    body: [
      'ServEase is not liable for any damages, losses, or disputes arising from services booked through the platform. Users engage with service workers at their own discretion.',
    ],
  },
];

function PolicySection({
  number,
  title,
  body,
  bullets,
}: {
  number: string;
  title: string;
  body?: string[];
  bullets?: string[];
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionNumber}>{number}.</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {body?.map((paragraph) => (
        <Text key={paragraph} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {bullets?.map((item) => (
        <View key={item} style={styles.listItem}>
          <View style={styles.listDot} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.documentCard}>
          <Text style={styles.documentLabel}>Legal Document</Text>
          <Text style={styles.documentTitle}>Terms & Conditions</Text>
          <Text style={styles.documentMeta}>Last updated: March 2026</Text>
          <View style={styles.documentDivider} />
          <Text style={styles.documentIntro}>
            These terms govern access to the ServEase platform, including bookings, account responsibilities, and permitted use.
          </Text>
        </View>

        {termsSections.map((section) => (
          <PolicySection key={section.number} {...section} />
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Questions About These Terms?</Text>
          <Text style={styles.footerText}>
            For clarification regarding these terms, please contact the ServEase support team through the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF2',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  documentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  documentLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 10,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 6,
  },
  documentMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
  },
  documentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  documentIntro: {
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D1B2A',
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginTop: 10,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  footerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5B6777',
  },
});
