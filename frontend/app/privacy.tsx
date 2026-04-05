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

const privacySections = [
  {
    number: '1',
    title: 'Introduction',
    body: [
      'ServEase is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use the app.',
    ],
  },
  {
    number: '2',
    title: 'Information We Collect',
    body: ['We collect the following information during registration and use:'],
    bullets: [
      'Full name, email address, and contact number.',
      'Address and location data, including city and province.',
      'Government-issued ID for service workers, when required.',
      'Booking history and transaction records.',
      'Device information and usage data.',
    ],
  },
  {
    number: '3',
    title: 'How We Use Your Information',
    body: ['We use your information to:'],
    bullets: [
      'Create and manage your account.',
      'Match customers with nearby service workers.',
      'Process bookings and calculate transportation fees.',
      'Send notifications about bookings and account updates.',
      'Improve the ServEase platform and user experience.',
      'Comply with legal obligations.',
    ],
  },
  {
    number: '4',
    title: 'Location Data',
    body: [
      'ServEase collects location information to support service discovery, define coverage areas, and calculate transport-related charges.',
      'Location data is collected only with your permission and is not sold to third parties.',
    ],
    bullets: [
      'Show customers nearby available service workers.',
      'Calculate distance and transportation fees.',
      'Define service worker coverage areas.',
    ],
  },
  {
    number: '5',
    title: 'Data Sharing',
    body: ['We do not sell your personal data. We may share information with:'],
    bullets: [
      'Service workers, limited to booking-relevant details after confirmation.',
      'Payment processors for transaction handling.',
      'Legal authorities when required under Philippine law.',
    ],
  },
  {
    number: '6',
    title: 'Data Security',
    body: [
      'We implement appropriate technical and organizational safeguards to protect personal information from unauthorized access, disclosure, or misuse.',
    ],
  },
  {
    number: '7',
    title: 'Data Retention',
    body: [
      'Your data is retained while your account remains active. Some information may be retained longer where necessary for compliance, dispute resolution, or lawful business purposes.',
    ],
  },
  {
    number: '8',
    title: 'Your Rights',
    body: ['Under the Philippine Data Privacy Act of 2012 (RA 10173), you may have the right to:'],
    bullets: [
      'Access your personal data.',
      'Correct inaccurate information.',
      'Request deletion of your data.',
      'Withdraw consent where processing is based on consent.',
    ],
  },
  {
    number: '9',
    title: 'Cookies & Analytics',
    body: [
      'ServEase may use analytics tools to monitor app performance and usage patterns. No personally identifiable information is intentionally shared through analytics reporting.',
    ],
  },
  {
    number: '10',
    title: 'Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. Material changes will be communicated through email or in-app notification where appropriate.',
    ],
  },
  {
    number: '11',
    title: 'Contact Us',
    body: [
      'For privacy concerns or data requests, you may contact the ServEase Data Privacy Officer at privacy@servease.ph.',
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

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.documentCard}>
          <Text style={styles.documentLabel}>Legal Document</Text>
          <Text style={styles.documentTitle}>Privacy Policy</Text>
          <Text style={styles.documentMeta}>Last updated: March 2026</Text>
          <View style={styles.documentDivider} />
          <Text style={styles.documentIntro}>
            This policy explains what personal information ServEase collects, why it is processed, and how it is handled.
          </Text>
        </View>

        {privacySections.map((section) => (
          <PolicySection key={section.number} {...section} />
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Need Assistance?</Text>
          <Text style={styles.footerText}>
            If you have questions about personal data handling or would like to submit a data request, please use the official ServEase privacy contact channel.
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
