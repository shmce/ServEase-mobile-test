import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ProviderNavigationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))}><Ionicons name="arrow-back" size={24} color="#0D1B2A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Ionicons name="navigate-circle-outline" size={72} color="#00B761" />
        <Text style={styles.text}>Open your maps app and travel to customer location.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/provider-start-service', params: { id } } as any)}>
          <Text style={styles.btnText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { marginTop: 12, color: '#556', textAlign: 'center' },
  btn: { marginTop: 20, height: 44, minWidth: 180, borderRadius: 10, backgroundColor: '#00B761', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

