import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getErrorMessage } from '@/lib/error-handling';
import { getServicesByCategoryName } from '@/services/marketplaceService';

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { title = 'Home Maintenance & Repair' } = useLocalSearchParams<{ title: string }>();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const rows = await getServicesByCategoryName(title);
        if (mounted) setServices(rows);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load services.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [title]);

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
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{services.length} services available</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? <ActivityIndicator size="large" color="#00B761" style={{ marginTop: 20 }} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!isLoading && !error && services.length === 0 ? <Text style={styles.emptyText}>No services found in this category.</Text> : null}

        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() =>
              router.push({
                pathname: '/provider-list',
                params: { serviceName: service.title },
              })
            }
          >
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description || 'No description provided.'}</Text>
            <Text style={styles.servicePrice}>From P{Number(service.price || 0).toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backButton: { padding: 5, marginRight: 15 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  scrollContent: { padding: 20 },
  serviceCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, marginBottom: 10 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#0D1B2A' },
  serviceDescription: { fontSize: 13, color: '#666', marginTop: 6 },
  servicePrice: { marginTop: 8, fontSize: 13, color: '#00B761', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 24 },
  errorText: { textAlign: 'center', color: '#C62828', marginTop: 24 },
});

