import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { supabase, identityDb } from '@/lib/db';
import { getErrorMessage } from '@/lib/error-handling';

export default function CustomerEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setEmail(user.email || '');

    async function loadProfile() {
      try {
        // Fetch base user data
        const { data: userData } = await identityDb
          .from('users')
          .select('*')
          .eq('id', user!.id)
          .single();
          
        if (userData) {
          setFullName(userData.full_name || '');
          setPhone(userData.contact_number || '');
        }

        // Fetch customer profile (for the address)
        const { data: profileData } = await identityDb
          .from('customer_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .single();
          
        if (profileData) {
          setAddress(profileData.address || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const isSaveEnabled =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0;

  const handleSave = async () => {
    if (!isSaveEnabled || !user) {
      Alert.alert('Missing Details', 'Please complete all profile fields before saving.');
      return;
    }
    setIsSaving(true);

    try {
      // Upsert users row to handle first-save cases where row doesn't exist yet
      const { error: userErr } = await identityDb
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || email.trim(),
          full_name: fullName.trim(), 
          contact_number: phone.trim(),
          role: 'customer',
        })
        
      if (userErr) throw userErr;

      // Upsert customer profile with compatible address field naming
      const { error: profileErr } = await supabase
        .from('customer_profiles')
        .upsert({ 
          user_id: user.id, 
          address: address.trim(),
        });

      if (profileErr) throw profileErr;

      Alert.alert('Profile Updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', getErrorMessage(err, 'Could not save profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 40 }} />
          ) : !user ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Login Required</Text>
              <Text style={styles.emptyStateText}>Please sign in before editing your profile.</Text>
              <TouchableOpacity style={styles.saveButton} onPress={() => router.replace('/customer-login' as any)}>
                <Text style={styles.saveButtonText}>Go To Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Profile Picture */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <TouchableOpacity style={styles.cameraButton}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address (Read-Only)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: '#F0F0F0' }]}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      editable={false}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                    <Ionicons name="location-outline" size={20} color="#999" style={[styles.inputIcon, { marginTop: 2 }]} />
                    <TextInput
                      style={[styles.input, { height: 'auto', textAlignVertical: 'top' }]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Enter your address"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, (!isSaveEnabled || isSaving) && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!isSaveEnabled || isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00C853',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  saveButton: {
    backgroundColor: '#00C853',
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#8FD9B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  emptyStateText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
});

