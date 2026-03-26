import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderProfileData } from '@/services/marketplaceService';
import { formatVerificationStatusLabel } from '@/services/providerVerificationService';

const TABS = ['About', 'Services', 'Reviews'];

const formatMemberSince = (value?: string | null) => {
  if (!value) return 'Recently joined';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently joined';
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { providerId = '', serviceName = '', providerName } = useLocalSearchParams<{ providerId: string; serviceName?: string; providerName?: string }>();
  const [activeTab, setActiveTab] = useState('About');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!providerId) {
        setError('Provider not found.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const data = await getProviderProfileData(providerId);
        if (mounted) setPayload(data);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load provider profile.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [providerId]);

  const providerDisplayName = useMemo(() => payload?.user?.full_name || providerName || 'Service Provider', [payload, providerName]);
  const serviceCount = Array.isArray(payload?.services) ? payload.services.length : 0;
  const reviewCount = Number(payload?.profile?.total_reviews || payload?.reviews?.length || 0);
  const averageRating = Number(payload?.profile?.average_rating || 0).toFixed(1);
  const serviceAreas = Array.isArray(payload?.profile?.service_areas) ? payload.profile.service_areas : [];
  const languages = Array.isArray(payload?.profile?.languages) ? payload.profile.languages : [];
  const socialLinks = [
    payload?.profile?.website_url
      ? { label: 'Website', value: String(payload.profile.website_url) }
      : null,
    payload?.profile?.facebook_url
      ? { label: 'Facebook', value: String(payload.profile.facebook_url) }
      : null,
    payload?.profile?.instagram_handle
      ? { label: 'Instagram', value: String(payload.profile.instagram_handle) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}>
            <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
          </TouchableOpacity>
          <Text style={styles.title}>{providerDisplayName}</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && payload ? (
        <>
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {activeTab === 'About' ? (
              <>
                <View style={styles.heroCard}>
                  <Text style={styles.businessName}>
                    {payload.profile?.business_name || providerDisplayName}
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    {formatVerificationStatusLabel(String(payload.profile?.verification_status || 'not_started'))}
                  </Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{averageRating}</Text>
                      <Text style={styles.metricLabel}>Rating</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{reviewCount}</Text>
                      <Text style={styles.metricLabel}>Reviews</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{serviceCount}</Text>
                      <Text style={styles.metricLabel}>Services</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionHeading}>About This Provider</Text>
                  <Text style={styles.cardText}>
                    {payload.profile?.bio
                      ? String(payload.profile.bio)
                      : 'This provider has not added a full bio yet, but you can still review their listed services and customer feedback below.'}
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionHeading}>Professional Snapshot</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="briefcase-outline" size={18} color="#00B761" />
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Business Name</Text>
                      <Text style={styles.infoValue}>
                        {payload.profile?.business_name || providerDisplayName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#00B761" />
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Verification Status</Text>
                      <Text style={styles.infoValue}>
                        {formatVerificationStatusLabel(String(payload.profile?.verification_status || 'not_started'))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color="#00B761" />
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Member Since</Text>
                      <Text style={styles.infoValue}>
                        {formatMemberSince(payload.user?.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={18} color="#00B761" />
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Experience</Text>
                      <Text style={styles.infoValue}>
                        {payload.profile?.years_experience
                          ? String(payload.profile.years_experience)
                          : 'Not specified yet'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionHeading}>Coverage & Communication</Text>
                  <Text style={styles.cardTitle}>Service Areas</Text>
                  <Text style={styles.cardText}>
                    {serviceAreas.length > 0 ? serviceAreas.join(', ') : 'Not specified yet'}
                  </Text>
                  <Text style={styles.cardTitle}>Languages</Text>
                  <Text style={styles.cardText}>
                    {languages.length > 0 ? languages.join(', ') : 'Not specified yet'}
                  </Text>
                </View>

                {(payload.user?.email || payload.user?.contact_number || socialLinks.length > 0) ? (
                  <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Contact & Links</Text>
                    {payload.user?.contact_number ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={18} color="#00B761" />
                        <View style={styles.infoTextWrap}>
                          <Text style={styles.infoLabel}>Phone</Text>
                          <Text style={styles.infoValue}>{String(payload.user.contact_number)}</Text>
                        </View>
                      </View>
                    ) : null}
                    {payload.user?.email ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={18} color="#00B761" />
                        <View style={styles.infoTextWrap}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue}>{String(payload.user.email)}</Text>
                        </View>
                      </View>
                    ) : null}
                    {socialLinks.map((item) => (
                      <View key={item.label} style={styles.infoRow}>
                        <Ionicons name="link-outline" size={18} color="#00B761" />
                        <View style={styles.infoTextWrap}>
                          <Text style={styles.infoLabel}>{item.label}</Text>
                          <Text style={styles.infoValue}>{item.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

            {activeTab === 'Services' ? (
              <View style={styles.card}>
                {(payload.services || []).map((svc: any) => (
                  <View key={svc.id} style={styles.rowItem}>
                    <Text style={styles.rowTitle}>{svc.title}</Text>
                    <Text style={styles.rowSub}>{svc.description || 'No description'}</Text>
                    <Text style={styles.rowPrice}>P{Number(svc.price || 0).toFixed(2)}</Text>
                  </View>
                ))}
                {(!payload.services || payload.services.length === 0) ? <Text style={styles.emptyText}>No services listed yet.</Text> : null}
              </View>
            ) : null}

            {activeTab === 'Reviews' ? (
              <View style={styles.card}>
                {(payload.reviews || []).map((rv: any) => (
                  <View key={rv.id} style={styles.rowItem}>
                    <Text style={styles.rowTitle}>{rv.reviewer_name}</Text>
                    <Text style={styles.rowSub}>Rating: {rv.rating}</Text>
                    <Text style={styles.rowSub}>{rv.review_text || 'No comment'}</Text>
                  </View>
                ))}
                {(!payload.reviews || payload.reviews.length === 0) ? <Text style={styles.emptyText}>No reviews yet.</Text> : null}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() =>
                  router.push({
                    pathname: '/customer-report-profile',
                    params: { providerId, providerName: providerDisplayName },
                  })
                }
              >
                <Ionicons name="flag-outline" size={18} color="#B42318" />
                <Text style={styles.reportBtnText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() =>
                  router.push({
                    pathname: '/customer-booking-form',
                    params: { providerId, providerName: providerDisplayName, serviceName },
                  })
                }
              >
                <Text style={styles.bookBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safe: { backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F0F2F5' },
  activeTab: { backgroundColor: '#00B761' },
  tabText: { color: '#0D1B2A', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  content: { padding: 12, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#F4FBF7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D8F1E1',
  },
  businessName: { fontSize: 22, fontWeight: '800', color: '#0D1B2A' },
  heroSubtitle: { fontSize: 13, fontWeight: '700', color: '#00B761', marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  metricValue: { fontSize: 18, fontWeight: '800', color: '#0D1B2A' },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#667085', marginTop: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 12 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#0D1B2A', marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0D1B2A', marginTop: 8 },
  cardText: { fontSize: 14, color: '#444', marginTop: 4, lineHeight: 21 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#667085', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#0D1B2A', lineHeight: 20 },
  rowItem: { borderBottomWidth: 1, borderBottomColor: '#EAECEF', paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B2A' },
  rowSub: { fontSize: 13, color: '#666', marginTop: 4 },
  rowPrice: { fontSize: 13, color: '#00B761', fontWeight: '700', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#777', paddingVertical: 16 },
  errorText: { textAlign: 'center', color: '#C62828', marginTop: 20, paddingHorizontal: 20 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  footerActions: { flexDirection: 'row', gap: 10 },
  reportBtn: {
    width: 110,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reportBtnText: { color: '#B42318', fontWeight: '700', fontSize: 15 },
  bookBtn: { flex: 1, backgroundColor: '#00B761', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

