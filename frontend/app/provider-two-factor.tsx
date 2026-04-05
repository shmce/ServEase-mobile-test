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

export default function ProviderTwoFactorScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [smsBackup, setSmsBackup] = useState(true);
  const [emailBackup, setEmailBackup] = useState(false);

  const handleSave = () => {
    Alert.alert('Security Updated', 'Your two-factor authentication settings were saved.', [
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
        <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Add another layer of protection to your provider account during sign-in.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Two-Factor Authentication</Text>
              <Text style={styles.rowSubtitle}>Require a verification code when logging in.</Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: '#E0E0E0', true: '#00B761' }} />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>SMS Backup Codes</Text>
              <Text style={styles.rowSubtitle}>Receive backup verification by text.</Text>
            </View>
            <Switch value={smsBackup} onValueChange={setSmsBackup} trackColor={{ false: '#E0E0E0', true: '#00B761' }} />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Email Backup Codes</Text>
              <Text style={styles.rowSubtitle}>Use email as a secondary recovery method.</Text>
            </View>
            <Switch value={emailBackup} onValueChange={setEmailBackup} trackColor={{ false: '#E0E0E0', true: '#00B761' }} />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Security Settings</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', flex: 1, marginLeft: 8 },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 24 },
  description: { fontSize: 15, lineHeight: 22, color: '#555', marginBottom: 24 },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  rowText: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#0D1B2A', marginBottom: 4 },
  rowSubtitle: { fontSize: 13, lineHeight: 19, color: '#6B7280' },
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
