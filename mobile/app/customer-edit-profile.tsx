import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';
import { getAvatarUrl, pickAndUploadAvatar } from '@/lib/avatar';
import {
  getCustomerProfile,
  getProfile as getUserProfile,
  updateCustomerProfile,
  updateProfile as updateUserProfile,
} from '@/services/profileService';

export default function CustomerEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  // Track original values to detect changes
  const [originalFullName, setOriginalFullName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [originalAvatarUri, setOriginalAvatarUri] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState('');

  // Load profile data from backend
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Create a timeout promise to prevent hanging
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      // Fetch data with timeout
      const [userData, profileData] = await Promise.race([
        Promise.all([getUserProfile(user?.id || ''), getCustomerProfile()]),
        timeout,
      ]) as any;

      const name = userData?.full_name || '';
      const phone_num = userData?.contact_number || '';
      const addr = profileData?.address || '';

      setFullName(name);
      setOriginalFullName(name);
      
      setPhone(phone_num);
      setOriginalPhone(phone_num);
      
      setAddress(addr);
      setOriginalAddress(addr);
    } catch (err) {
      console.log('Profile load error (non-blocking):', err);
      // Silently continue - form is already visible for manual entry
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [user?.id])
  );

  useEffect(() => {
    // Set email and avatar when user is available
    if (user) {
      const userEmail = user.email || '';
      setEmail(userEmail);
      setOriginalEmail(userEmail);
      const avatarUrl = `${getAvatarUrl(user.id)}?t=${Date.now()}`;
      setAvatarUri(avatarUrl);
      setOriginalAvatarUri(avatarUrl);
    }
  }, [user]);

  const handlePickAvatar = async () => {
    if (!user?.id) return;
    const url = await pickAndUploadAvatar(user.id);
    if (url) setAvatarUri(url);
  };

  const isSaveEnabled =
    fullName.trim().length > 0 &&
    phone.trim().length === 10 &&
    address.trim().length > 0 &&
    (fullName !== originalFullName || 
     phone !== originalPhone || 
     address !== originalAddress ||
     avatarUri !== originalAvatarUri);

  const handleSave = async () => {
    if (!isSaveEnabled) {
      Alert.alert('Missing Details', 'Please complete all profile fields before saving.');
      return;
    }
    setIsSaving(true);

    try {
      console.log('=== Starting Save Operation ===');
      console.log('User from context:', user?.id);
      
      // If user.id is not available from context, try the update anyway
      // The backend will use the JWT token to identify the user
      if (user?.id) {
        console.log('Step 1: Calling updateUserProfile with user ID:', user.id);
        try {
          const userResult = await updateUserProfile(user.id, {
            full_name: fullName.trim(),
            contact_number: phone.trim(),
          });
          console.log('Step 1 Success:', JSON.stringify(userResult, null, 2));
        } catch (err) {
          console.error('Step 1 Error:', err);
          throw err;
        }
      } else {
        console.warn('User ID not available from context, but attempting update anyway...');
        // Still try to call updateUserProfile with empty user ID
        // The backend JWT auth should handle it
        try {
          const userResult = await updateUserProfile('', {
            full_name: fullName.trim(),
            contact_number: phone.trim(),
          });
          console.log('Step 1 Success (via JWT):', JSON.stringify(userResult, null, 2));
        } catch (err) {
          console.error('Step 1 Error:', err);
          throw err;
        }
      }

      // Update customer-specific fields (address)
      console.log('Step 2: Calling updateCustomerProfile...');
      try {
        const customerResult = await updateCustomerProfile({
          address: address.trim(),
        });
        console.log('Step 2 Success:', JSON.stringify(customerResult, null, 2));
      } catch (err) {
        console.error('Step 2 Error:', err);
        throw err;
      }

      // Wait for backend to persist
      console.log('Step 3: Waiting for backend to persist...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload profile data
      console.log('Step 4: Reloading profile data from backend...');
      await loadProfile();
      console.log('Step 4: Profile reloaded successfully');

      console.log('=== Save Operation Complete ===');
      Alert.alert('Success!', 'Your profile has been saved.', [
        { 
          text: 'OK', 
          onPress: () => {
            console.log('Going back...');
            router.back();
          }
        },
      ]);
    } catch (err: any) {
      console.error('=== Save Error ===');
      console.error('Error:', err?.message || String(err));
      Alert.alert('Update Failed', err?.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    // Temporarily show form even if user is not in context
    // The user object may not be hydrated yet but they can still edit their profile
    
    return (
      <>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                onError={() => setAvatarUri(null)}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar}>
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
                value={email || ''}
                editable={false}
                placeholder="Email not available"
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
                onChangeText={(text) => {
                  // Only allow numbers and limit to 10 digits
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 10) {
                    setPhone(numericText);
                  }
                }}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                maxLength={10}
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
        </View>
      </>
    );
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
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {renderContent()}
        </ScrollView>

        {/* Sticky Save Button */}
        <View style={styles.stickyButtonContainer}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  scrollContainer: { flex: 1 },
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
    paddingBottom: 20,
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
    marginTop: 0,
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
  stickyButtonContainer: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
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

