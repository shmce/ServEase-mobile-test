import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SettingsRow } from '@/components/ui/settings-row';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAuth } from '@/hooks/useAuth';
import {
  formatVerificationLevelLabel,
  formatVerificationStatusLabel,
  getProviderVerificationDraft,
} from '@/services/providerVerificationService';

const CategoryHeader = ({ title }: { title: string }) => (
  <View style={styles.categoryHeader}>
    <Text style={styles.categoryTitle}>{title}</Text>
  </View>
);

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const unreadNotifications = useUnreadNotifications();
  const [verificationSummary, setVerificationSummary] = useState('Not started');
  
  // Toggles state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      async function loadVerification() {
        if (!user?.id) return;
        try {
          const draft = await getProviderVerificationDraft(user.id);
          if (!mounted) return;
          setVerificationSummary(
            `${formatVerificationStatusLabel(draft.status)} • ${formatVerificationLevelLabel(draft.verificationLevel)}`
          );
        } catch {
          if (mounted) setVerificationSummary('Not started');
        }
      }

      void loadVerification();
      return () => {
        mounted = false;
      };
    }, [user?.id])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <CategoryHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingsRow 
            icon="person-outline" 
            label="Edit Profile" 
            variant="setting"
            onPress={() => router.push('/provider-edit-profile' as any)}
          />
          <SettingsRow
            icon="cash-outline"
            label="Services & Pricing"
            variant="setting"
            onPress={() => router.push('/(provider-tabs)/pricing' as any)}
          />
          <SettingsRow 
            icon="location-outline" 
            label="Manage Addresses" 
            variant="setting"
            onPress={() => router.push('/manage-addresses' as any)}
          />
          <SettingsRow 
            icon="time-outline" 
            label="Availability" 
            variant="setting"
            onPress={() => router.push('/provider-availability' as any)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Profile & Verification"
            sublabel={verificationSummary}
            variant="setting"
            onPress={() => router.push('/provider-verification' as any)}
          />
        </View>

        {/* Notifications Section */}
        <CategoryHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingsRow 
            icon="notifications-outline" 
            label="Push Notifications" 
            variant="setting"
            mode="toggle"
            value={pushEnabled} 
            onValueChange={setPushEnabled} 
          />
          <SettingsRow 
            icon="phone-portrait-outline" 
            label="SMS Notifications" 
            variant="setting"
            mode="toggle"
            value={smsEnabled} 
            onValueChange={setSmsEnabled} 
          />
          <SettingsRow 
            icon="mail-outline" 
            label="Email Notifications" 
            variant="setting"
            mode="toggle"
            value={emailEnabled} 
            onValueChange={setEmailEnabled} 
          />
          <SettingsRow 
            icon="notifications" 
            label="Notification Inbox" 
            sublabel="Messages, updates, and reminders"
            badgeCount={unreadNotifications}
            variant="setting"
            onPress={() => router.push('/notifications' as any)}
          />
          <SettingsRow 
            icon="notifications-outline" 
            label="Advanced Notification Preferences" 
            variant="setting"
            onPress={() => router.push('/provider-notification-preferences' as any)}
          />
        </View>

        {/* Privacy & Security */}
        <CategoryHeader title="PRIVACY & SECURITY" />
        <View style={styles.section}>
          <SettingsRow variant="setting" icon="lock-closed-outline" label="Change Password" />
          <SettingsRow variant="setting" icon="shield-checkmark-outline" label="Two-Factor Authentication" sublabel="Status: On" />
          <SettingsRow variant="setting" icon="pulse-outline" label="Login Activity" />
          <SettingsRow variant="setting" icon="eye-outline" label="Privacy Settings" />
        </View>

        {/* App Preferences */}
        <CategoryHeader title="APP PREFERENCES" />
        <View style={styles.section}>
          <SettingsRow variant="setting" icon="globe-outline" label="Language" sublabel="English" />
          <SettingsRow variant="setting" icon="cash-outline" label="Currency" sublabel="PHP (₱)" />
          <SettingsRow variant="setting" icon="ruler-outline" label="Distance Unit" sublabel="Kilometers" />
          <SettingsRow 
            icon="moon-outline" 
            label="Dark Mode" 
            variant="setting"
            mode="toggle"
            value={darkMode} 
            onValueChange={setDarkMode} 
          />
        </View>

        {/* Legal & Support */}
        <CategoryHeader title="LEGAL & SUPPORT" />
        <View style={styles.section}>
          <SettingsRow variant="setting" icon="document-text-outline" label="Provider Agreement" />
          <SettingsRow 
            icon="document-text-outline" 
            label="Terms and Conditions" 
            variant="setting"
            onPress={() => router.push('/terms' as any)} 
          />
          <SettingsRow 
            icon="lock-closed-outline" 
            label="Privacy Policy" 
            variant="setting"
            onPress={() => router.push('/privacy' as any)} 
          />
          <SettingsRow 
            icon="help-circle-outline" 
            label="Help Center" 
            variant="setting"
            onPress={() => router.push('/provider-help' as any)}
          />
          <SettingsRow variant="setting" icon="headset-outline" label="Contact Support" />
          <SettingsRow variant="setting" icon="people-outline" label="Provider Community" />
        </View>

        {/* Account Actions */}
        <CategoryHeader title="ACCOUNT ACTIONS" />
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => router.replace('/login' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF4D4D" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  categoryHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#FFF',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4D4D',
  },
  deleteButton: {
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4D4D',
    textDecorationLine: 'underline',
  },
  footerSpacer: {
    height: 40,
  },
});

