import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getErrorMessage } from '@/lib/error-handling';
import { getProviderProfileData } from '@/services/marketplaceService';

const TABS = ['About', 'Services', 'Reviews'];

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
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Business Name</Text>
                <Text style={styles.cardText}>{payload.profile?.business_name || providerDisplayName}</Text>
                <Text style={styles.cardTitle}>Rating</Text>
                <Text style={styles.cardText}>{Number(payload.profile?.average_rating || 0).toFixed(1)} ({Number(payload.profile?.total_reviews || 0)} reviews)</Text>
                <Text style={styles.cardTitle}>Status</Text>
                <Text style={styles.cardText}>{String(payload.profile?.verification_status || 'pending')}</Text>
              </View>
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
  card: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0D1B2A', marginTop: 8 },
  cardText: { fontSize: 14, color: '#444', marginTop: 4 },
  rowItem: { borderBottomWidth: 1, borderBottomColor: '#EAECEF', paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B2A' },
  rowSub: { fontSize: 13, color: '#666', marginTop: 4 },
  rowPrice: { fontSize: 13, color: '#00B761', fontWeight: '700', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#777', paddingVertical: 16 },
  errorText: { textAlign: 'center', color: '#C62828', marginTop: 20, paddingHorizontal: 20 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  bookBtn: { backgroundColor: '#00B761', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

