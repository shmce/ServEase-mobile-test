import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/apiClient';
import { providerCatalogDb } from '@/lib/db';
import { getErrorMessage } from '@/lib/error-handling';
import { getAvatarUrl, pickAndUploadAvatar } from '@/lib/avatar';

const parseTagInput = (value: string) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const formatTagInput = (values: string[]) => values.join(', ');

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ReadonlyChip = ({ label }: { label: string }) => (
  <View style={styles.readonlyChip}>
    <Text style={styles.readonlyChipText}>{label}</Text>
  </View>
);

export default function ProviderEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [serviceAreasText, setServiceAreasText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user?.id) {
        setIsLoading(false);
        setError('You must be logged in to edit your profile.');
        return;
      }

      setIsLoading(true);
      setError('');
      setAvatarUri(`${getAvatarUrl(user.id)}?t=${Date.now()}`);

      try {
        const [userResp, profileResp, servicesResp] = await Promise.all([
          api.get<any>('/users/profile'),
          api.get<any>('/provider/profile'),
          providerCatalogDb
            .from('provider_services')
            .select('service_categories(name)')
            .eq('provider_id', user.id)
        ]);

        if (!mounted) return;

        const userData = userResp;
        const profile = profileResp;
        const services = servicesResp.data;

        setFullName(userData?.full_name || '');
        setBusinessName(profile?.business_name || '');
        setBio(profile?.bio || '');
        setServiceAreasText(formatTagInput(profile?.service_areas || []));
        setLanguagesText(formatTagInput(profile?.languages || []));
        setYearsExperience(String(profile?.years_experience ?? ''));
        setFacebookUrl(profile?.facebook_url || '');
        setInstagramHandle(profile?.instagram_handle || '');
        setWebsiteUrl(profile?.website_url || '');

        const cats = (services || [])
          .map((s: any) => s.service_categories?.name)
          .filter(Boolean);
        setServiceCategories([...new Set(cats)] as string[]);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Failed to load provider profile.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => { mounted = false; };
  }, [user?.id]);

  const handlePickAvatar = async () => {
    if (!user) return;
    const url = await pickAndUploadAvatar(user.id);
    if (url) setAvatarUri(url);
  };

  const onSave = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in again before saving your profile.');
      return;
    }

    if (!fullName.trim() || !businessName.trim()) {
      Alert.alert('Missing Details', 'Full name and business name are required.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update generic user fields (name, phone)
      await api.patch('/users/profile', {
        full_name: fullName.trim(),
      });

      // 2. Update provider-specific fields
      await api.patch('/provider/profile', {
        business_name: businessName.trim(),
        bio: bio.trim(),
        service_areas: parseTagInput(serviceAreasText),
        languages: parseTagInput(languagesText),
        years_experience: yearsExperience.trim() ? Number(yearsExperience.trim()) : null,
        facebook_url: facebookUrl.trim() || null,
        instagram_handle: instagramHandle.trim() || null,
        website_url: websiteUrl.trim() || null,
      });

      Alert.alert('Profile Updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Save Failed', getErrorMessage(err, 'Could not save provider profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/(provider-tabs)/more' as any))}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={() => void onSave()} disabled={isSaving || isLoading}>
          <Text style={[styles.headerButtonText, styles.saveText, (isSaving || isLoading) && styles.disabledText]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color="#00B761" />
            <Text style={styles.stateText}>Loading provider profile...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading ? (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              {/* Avatar */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} onError={() => setAvatarUri(null)} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase() || 'P'}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <SectionHeader title="Basic Information" />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Enter business name" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio / Description</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={5}
                    value={bio}
                    onChangeText={setBio}
                    maxLength={500}
                    placeholder="Tell customers about your experience, quality, and service style."
                  />
                  <Text style={styles.charCount}>{bio.length}/500</Text>
                </View>
              </View>

              <SectionHeader title="Coverage & Languages" />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Areas</Text>
                <TextInput style={styles.input} value={serviceAreasText} onChangeText={setServiceAreasText} placeholder="Makati, Pasig, Quezon City" />
                <Text style={styles.helperText}>Separate multiple areas with commas.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages Spoken</Text>
                <TextInput style={styles.input} value={languagesText} onChangeText={setLanguagesText} placeholder="English, Tagalog" />
                <Text style={styles.helperText}>Separate multiple languages with commas.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} placeholder="e.g. 5" keyboardType="numeric" />
              </View>

              <SectionHeader title="Services" />

              <Text style={styles.label}>Current Service Categories</Text>
              <View style={styles.chipRow}>
                {serviceCategories.length > 0 ? (
                  serviceCategories.map((category) => <ReadonlyChip key={category} label={category} />)
                ) : (
                  <Text style={styles.helperText}>No service categories found yet. Add services in Services & Pricing.</Text>
                )}
              </View>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(provider-tabs)/pricing' as any)}>
                <Ionicons name="cash-outline" size={18} color="#00B761" />
                <Text style={styles.linkText}>Manage Services & Pricing</Text>
              </TouchableOpacity>

              <SectionHeader title="Social Media & Links" />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Facebook</Text>
                <TextInput style={styles.input} value={facebookUrl} onChangeText={setFacebookUrl} placeholder="facebook.com/yourbusiness" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput style={styles.input} value={instagramHandle} onChangeText={setInstagramHandle} placeholder="@yourbusiness" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput style={styles.input} value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="www.yourbusiness.com" autoCapitalize="none" />
              </View>

              <TouchableOpacity
                style={[styles.saveActionButton, isSaving && styles.saveActionButtonDisabled]}
                onPress={() => void onSave()}
                disabled={isSaving}
              >
                <Text style={styles.saveActionButtonText}>{isSaving ? 'Saving...' : 'Save Profile'}</Text>
              </TouchableOpacity>

              <View style={styles.footerSpacer} />
            </View>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  headerButtonText: { fontSize: 15, color: '#8E8E93', fontWeight: '500' },
  saveText: { color: '#00B761', fontWeight: '700' },
  disabledText: { opacity: 0.5 },
  stateWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20 },
  stateText: { color: '#64748B' },
  errorText: { color: '#C62828', paddingHorizontal: 20, paddingTop: 16 },
  scrollContainer: { flex: 1 },
  formContent: { paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginTop: 24, marginBottom: 8 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00B761',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    fontSize: 15,
    color: '#0D1B2A',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textAreaContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textArea: { fontSize: 15, color: '#0D1B2A', minHeight: 110, textAlignVertical: 'top' },
  charCount: { alignSelf: 'flex-end', marginTop: 8, fontSize: 12, color: '#8E8E93' },
  helperText: { marginTop: 8, fontSize: 12, color: '#8E8E93' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  readonlyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8FBF2',
  },
  readonlyChipText: { color: '#00B761', fontWeight: '600', fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  linkText: { color: '#00B761', fontWeight: '700' },
  saveActionButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveActionButtonDisabled: { opacity: 0.6 },
  saveActionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  footerSpacer: { height: 28 },
});
