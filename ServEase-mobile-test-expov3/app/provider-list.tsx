import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getErrorMessage } from '@/lib/error-handling';
import { getProvidersByServiceName, ProviderCard } from '@/services/marketplaceService';

export default function ProviderListScreen() {
  const router = useRouter();
  const { serviceName = 'General Service' } = useLocalSearchParams<{ serviceName: string }>();
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const rows = await getProvidersByServiceName(serviceName);
        if (mounted) setProviders(rows);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load providers.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [serviceName]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{serviceName}</Text>
              <Text style={styles.headerSubtitle}>{providers.length} providers available</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!isLoading && !error && providers.length === 0 ? <Text style={styles.emptyText}>No providers found for this service.</Text> : null}

        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={styles.providerCard}
            onPress={() =>
              router.push({
                pathname: '/provider-profile',
                params: {
                  providerId: provider.id,
                  serviceName,
                  providerName: provider.name,
                },
              })
            }
          >
            <Text style={styles.businessName}>{provider.businessName}</Text>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Rating: {provider.rating.toFixed(1)}</Text>
              <Text style={styles.metaText}>Reviews: {provider.reviews}</Text>
              <Text style={styles.priceText}>{provider.priceLabel}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backButton: { padding: 5, marginRight: 15 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  scrollContent: { padding: 20 },
  providerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  businessName: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  providerName: { fontSize: 14, color: '#555', marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaText: { fontSize: 12, color: '#777' },
  priceText: { fontSize: 13, fontWeight: '700', color: '#00B761' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 24 },
  errorText: { textAlign: 'center', color: '#C62828', marginTop: 24 },
});

