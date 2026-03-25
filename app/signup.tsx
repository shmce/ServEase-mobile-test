import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function SignUpSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Choose how you want to continue</Text>

        <View style={styles.selectionContainer}>
          <TouchableOpacity 
            style={styles.selectionCard}
            onPress={() => router.push('/customer-signup' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8FBF2' }]}>
              <Ionicons name="person-outline" size={28} color="#00B761" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Customer</Text>
              <Text style={styles.cardDescription}>Find and book services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.selectionCard}
            onPress={() => router.push('/provider-signup' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8FBF2' }]}>
              <Ionicons name="briefcase-outline" size={28} color="#00B761" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Service Provider</Text>
              <Text style={styles.cardDescription}>Offer services and manage bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.replace('/')}>
              Log In
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 40,
  },
  selectionContainer: {
    gap: 20,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#777',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#777',
  },
  loginLink: {
    color: '#00B761',
    fontWeight: '700',
  },
});

