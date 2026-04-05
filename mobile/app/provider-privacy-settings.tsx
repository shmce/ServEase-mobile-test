import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PrivacyRow = ({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.privacyRow}>
    <View style={styles.privacyText}>
      <Text style={styles.privacyTitle}>{title}</Text>
      <Text style={styles.privacySubtitle}>{subtitle}</Text>
    </View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#E0E0E0', true: '#00B761' }} />
  </View>
);

export default function ProviderPrivacySettingsScreen() {
  const router = useRouter();
  const [profileVisible, setProfileVisible] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [analyticsSharing, setAnalyticsSharing] = useState(true);

  const handleSave = () => {
    Alert.alert('Privacy Updated', 'Your privacy settings have been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Control which provider details are visible to customers and how account data is used.
        </Text>

        <View style={styles.card}>
          <PrivacyRow
            title="Public Profile Visibility"
            subtitle="Show your provider profile in search results and recommendations."
            value={profileVisible}
            onValueChange={setProfileVisible}
          />
          <View style={styles.separator} />
          <PrivacyRow
            title="Display Phone Number"
            subtitle="Allow customers to see your phone number after a booking is confirmed."
            value={showPhone}
            onValueChange={setShowPhone}
          />
          <View style={styles.separator} />
          <PrivacyRow
            title="Display Full Address"
            subtitle="Only show your full address when service logistics require it."
            value={showAddress}
            onValueChange={setShowAddress}
          />
          <View style={styles.separator} />
          <PrivacyRow
            title="Analytics Sharing"
            subtitle="Help improve the platform by sharing anonymous usage data."
            value={analyticsSharing}
            onValueChange={setAnalyticsSharing}
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Privacy Settings</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 24 },
  description: { fontSize: 15, lineHeight: 22, color: '#555', marginBottom: 24 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 16,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  privacyText: { flex: 1, paddingRight: 16 },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: '#0D1B2A', marginBottom: 4 },
  privacySubtitle: { fontSize: 13, lineHeight: 19, color: '#6B7280' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  primaryButton: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#00B761',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
