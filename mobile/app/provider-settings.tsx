import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CategoryHeader = ({ title }: { title: string }) => (
  <View style={styles.categoryHeader}>
    <Text style={styles.categoryTitle}>{title}</Text>
  </View>
);

const SettingItem = ({ icon, label, sublabel, onPress }: any) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={20} color="#00B761" />
    </View>
    <View style={styles.labelContainer}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CCC" />
  </TouchableOpacity>
);

export default function ProviderSettingsScreen() {
  const router = useRouter();

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
          <SettingItem
            icon="cash-outline"
            label="Services & Pricing"
            onPress={() => router.push('/provider-services-pricing' as any)}
          />
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
        </View>

        {/* Notifications Section */}
        <CategoryHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingItem 
            icon="notifications-outline" 
            label="Notification Preferences"
            onPress={() => router.push('/provider-notification-preferences' as any)}
          />
        </View>

        {/* Security */}
        <CategoryHeader title="SECURITY" />
        <View style={styles.section}>
          <SettingItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => router.push('/provider-change-password' as any)}
          />
          <SettingItem
            icon="pulse-outline"
            label="Login Activity"
            onPress={() => router.push('/provider-login-activity' as any)}
          />
          <SettingItem
            icon="eye-outline"
            label="Privacy Settings"
            onPress={() => router.push('/provider-privacy-settings' as any)}
          />
        </View>

        {/* App Preferences */}
        <CategoryHeader title="APP PREFERENCES" />
        <View style={styles.section}>
          <SettingItem
            icon="options-outline"
            label="App Preferences"
            sublabel="Language, currency, and distance unit"
            onPress={() => router.push('/provider-app-preferences' as any)}
          />
        </View>

        {/* Legal */}
        <CategoryHeader title="LEGAL" />
        <View style={styles.section}>
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
    backgroundColor: '#FFF',
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
