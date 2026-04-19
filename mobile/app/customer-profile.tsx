import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import {
  getCustomerProfile,
  getProfile as getUserProfile,
} from '@/services/profileService';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const [userData, profileData] = await Promise.race([
        Promise.all([getUserProfile(user?.id || ''), getCustomerProfile()]),
        timeout,
      ]) as any;

      const name = userData?.full_name || '';
      const phone_num = userData?.contact_number || '';
      const addr = profileData?.address || '';

      setFullName(name);
      setPhone(phone_num);
      setAddress(addr);
    } catch (err) {
      console.log('Profile load error (non-blocking):', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [user?.id])
  );

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setAvatarUri(`${getAvatarUrl(user.id)}?t=${Date.now()}`);
    }
  }, [user]);

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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
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
                    <Text style={styles.avatarInitial}>
                      {fullName.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.displayName}>{fullName || 'User'}</Text>
            </View>

            {/* Profile Information Cards */}
            <View style={styles.infoSection}>
              {/* Full Name */}
              <View style={styles.infoCard}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="person-outline" size={18} color="#00C853" />
                  <Text style={styles.infoLabel}>Full Name</Text>
                </View>
                <Text style={styles.infoValue}>{fullName || 'Not provided'}</Text>
              </View>

              {/* Email */}
              <View style={styles.infoCard}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="mail-outline" size={18} color="#00C853" />
                  <Text style={styles.infoLabel}>Email Address</Text>
                </View>
                <Text style={styles.infoValue}>{email || 'Not provided'}</Text>
              </View>

              {/* Phone */}
              <View style={styles.infoCard}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="call-outline" size={18} color="#00C853" />
                  <Text style={styles.infoLabel}>Phone Number</Text>
                </View>
                <Text style={styles.infoValue}>{phone || 'Not provided'}</Text>
              </View>

              {/* Address */}
              <View style={styles.infoCard}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="location-outline" size={18} color="#00C853" />
                  <Text style={styles.infoLabel}>Address</Text>
                </View>
                <Text style={styles.infoValue}>{address || 'Not provided'}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Edit Profile Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/customer-edit-profile' as any)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 15,
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
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  infoSection: {
    gap: 15,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 28,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 20,
  },
  editButton: {
    backgroundColor: '#00C853',
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
