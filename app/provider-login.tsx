import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/error-handling';

export default function ProviderLoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoginReady = email.trim().length > 0 && password.trim().length > 0;

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
        <Text style={styles.headerTitle}>Provider Login</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome, provider!</Text>
          <Text style={styles.subtitle}>Login to manage your services</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#CCC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#CCC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#555" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/provider-forgot-password' as any)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: isLoginReady ? '#00B761' : '#A5E6BA' }]}
              onPress={async () => {
                if (!isLoginReady) return;
                setIsSubmitting(true);
                try {
                  const normalizedEmail = email.trim().toLowerCase();
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: password.trim(),
                  });

                  if (error) {
                    const normalizedError = getErrorMessage(error, 'Invalid email or password.');
                    if (normalizedError.toLowerCase().includes('email not confirmed')) {
                      Alert.alert('Email Not Confirmed', 'Please verify your email address first, then log in.');
                      return;
                    }
                    throw error;
                  }

                  const roleRaw =
                    data.user?.user_metadata?.role ??
                    data.user?.app_metadata?.role ??
                    data.user?.user_metadata?.user_type ??
                    data.user?.app_metadata?.user_type ??
                    '';
                  let resolvedRole = String(roleRaw).toLowerCase();

                  if (!resolvedRole && data.user?.id) {
                    const { data: roleRow } = await supabase
                      .from('users')
                      .select('role')
                      .eq('id', data.user.id)
                      .single();
                    resolvedRole = String(roleRow?.role || '').toLowerCase();
                  }

                  if (!resolvedRole && data.user?.id) {
                    const { data: providerRow } = await supabase
                      .from('provider_profiles')
                      .select('user_id')
                      .eq('user_id', data.user.id)
                      .limit(1)
                      .maybeSingle();
                    if (providerRow) {
                      resolvedRole = 'provider';
                    }
                  }

                  const isProvider = resolvedRole.includes('provider');
                  router.replace((isProvider ? '/(provider-tabs)' : '/(tabs)') as any);
                } catch (err: any) {
                  Alert.alert('Login Failed', getErrorMessage(err, 'Invalid email or password.'));
                } finally {
                  setIsSubmitting(false);
                }
              }}
              activeOpacity={0.8}
              disabled={!isLoginReady || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.signUpLink} onPress={() => router.push('/signup')}>
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0D1B2A',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#00B761',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#A5E6BA', 
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
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
  signUpLink: {
    color: '#00B761',
    fontWeight: '700',
  },
});

