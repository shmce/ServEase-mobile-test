import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isReady =
    password.trim().length >= 8 &&
    confirmPassword.trim().length >= 8 &&
    password === confirmPassword;

  const onSubmit = async () => {
    if (!isReady) {
      Alert.alert('Invalid Password', 'Please enter matching passwords with at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      await supabase.auth.signOut();
      Alert.alert('Password Updated', 'Your password has been reset. Please log in with your new password.', [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/login' as any),
        },
      ]);
    } catch (error) {
      Alert.alert('Reset Failed', getErrorMessage(error, 'Could not update your password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/login' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create a new password</Text>
        <Text style={styles.subtitle}>
          {isLoading
            ? 'Checking your recovery session...'
            : user
              ? 'Enter your new password below.'
              : 'Open the reset link from your email on this device to continue.'}
        </Text>

        {!isLoading && !user ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              The password reset link needs to open this app first so we can verify your recovery session.
            </Text>
          </View>
        ) : null}

        {!isLoading && user ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#CCC"
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#777" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#CCC"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!isReady || isSubmitting) && styles.primaryButtonDisabled]}
              onPress={onSubmit}
              disabled={!isReady || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0D1B2A' },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#0D1B2A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#777', marginBottom: 24 },
  infoCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
  },
  infoText: { color: '#445', lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#0D1B2A', marginBottom: 8 },
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
  eyeIcon: { paddingHorizontal: 14, paddingVertical: 12 },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#00B761',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
