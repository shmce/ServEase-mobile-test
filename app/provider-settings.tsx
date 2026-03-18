import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CategoryHeader = ({ title }: { title: string }) => (
  <View style={styles.categoryHeader}>
    <Text style={styles.categoryTitle}>{title}</Text>
  </View>
);

const SettingItem = ({ icon, label, sublabel, type = 'nav', value, onValueChange, onPress }: any) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    disabled={type === 'toggle'}
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={20} color="#00B761" />
    </View>
    <View style={styles.labelContainer}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
    </View>
    {type === 'nav' ? (
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    ) : (
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#00B761' }}
        thumbColor={Platform.OS === 'ios' ? '#FFF' : value ? '#FFF' : '#F4F3F4'}
      />
    )}
  </TouchableOpacity>
);

export default function ProviderSettingsScreen() {
  const router = useRouter();
  
  // Toggles state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <CategoryHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingItem 
            icon="person-outline" 
            label="Edit Profile" 
            onPress={() => router.push('/provider-edit-profile' as any)}
          />
          <SettingItem icon="cash-outline" label="Services & Pricing" />
          <SettingItem 
            icon="location-outline" 
            label="Manage Addresses" 
            onPress={() => router.push('/manage-addresses' as any)}
          />
          <SettingItem 
            icon="time-outline" 
            label="Availability" 
            onPress={() => router.push('/provider-availability' as any)}
          />
          <SettingItem icon="card-outline" label="Payment Methods" />
        </View>

        {/* Notifications Section */}
        <CategoryHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingItem 
            icon="notifications-outline" 
            label="Push Notifications" 
            type="toggle" 
            value={pushEnabled} 
            onValueChange={setPushEnabled} 
          />
          <SettingItem 
            icon="phone-portrait-outline" 
            label="SMS Notifications" 
            type="toggle" 
            value={smsEnabled} 
            onValueChange={setSmsEnabled} 
          />
          <SettingItem 
            icon="mail-outline" 
            label="Email Notifications" 
            type="toggle" 
            value={emailEnabled} 
            onValueChange={setEmailEnabled} 
          />
          <SettingItem 
            icon="notifications-outline" 
            label="Advanced Notification Preferences" 
            color="#00B761" 
            isAction 
            onPress={() => router.push('/provider-notification-preferences' as any)}
          />
        </View>

        {/* Privacy & Security */}
        <CategoryHeader title="PRIVACY & SECURITY" />
        <View style={styles.section}>
          <SettingItem icon="lock-closed-outline" label="Change Password" />
          <SettingItem icon="shield-checkmark-outline" label="Two-Factor Authentication" sublabel="Status: On" />
          <SettingItem icon="pulse-outline" label="Login Activity" />
          <SettingItem icon="eye-outline" label="Privacy Settings" />
        </View>

        {/* App Preferences */}
        <CategoryHeader title="APP PREFERENCES" />
        <View style={styles.section}>
          <SettingItem icon="globe-outline" label="Language" sublabel="English" />
          <SettingItem icon="cash-outline" label="Currency" sublabel="PHP (₱)" />
          <SettingItem icon="ruler-outline" label="Distance Unit" sublabel="Kilometers" />
          <SettingItem 
            icon="moon-outline" 
            label="Dark Mode" 
            type="toggle" 
            value={darkMode} 
            onValueChange={setDarkMode} 
          />
        </View>

        {/* Legal & Support */}
        <CategoryHeader title="LEGAL & SUPPORT" />
        <View style={styles.section}>
          <SettingItem icon="document-text-outline" label="Provider Agreement" />
          <SettingItem 
            icon="document-text-outline" 
            label="Terms and Conditions" 
            onPress={() => router.push('/terms' as any)} 
          />
          <SettingItem 
            icon="lock-closed-outline" 
            label="Privacy Policy" 
            onPress={() => router.push('/privacy' as any)} 
          />
          <SettingItem 
            icon="help-circle-outline" 
            label="Help Center" 
            onPress={() => router.push('/provider-help' as any)}
          />
          <SettingItem icon="headset-outline" label="Contact Support" />
          <SettingItem icon="people-outline" label="Provider Community" />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  labelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0D1B2A',
  },
  settingSublabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  footerSpacer: {
    height: 40,
  },
});
