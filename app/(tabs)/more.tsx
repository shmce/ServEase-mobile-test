import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MenuItem = ({ icon, label, sublabel, onPress, isDestructive }: any) => (
  <TouchableOpacity 
    style={styles.menuItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, isDestructive && styles.destructiveIconBox]}>
      <Ionicons name={icon} size={22} color={isDestructive ? '#FF5252' : '#00C853'} />
    </View>
    <View style={styles.menuLabelContainer}>
      <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
      {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CCC" />
  </TouchableOpacity>
);

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/customer-edit-profile' as any)} />
          <MenuItem icon="location-outline" label="Manage Addresses" onPress={() => router.push('/manage-addresses' as any)} />
          <MenuItem icon="notifications-outline" label="Notification Preferences" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <MenuItem icon="chatbubble-outline" label="Report an Issue" onPress={() => router.push('/provider-report-issue' as any)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTNERSHIP</Text>
          <MenuItem 
            icon="briefcase-outline" 
            label="Join the ServEase Team" 
            sublabel="Be your own boss and earn more"
            onPress={() => router.push('/provider-join' as any)} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/terms' as any)} />
          <MenuItem icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
        </View>

        <View style={styles.section}>
          <MenuItem 
            icon="log-out-outline" 
            label="Log Out" 
            onPress={() => router.replace('/login' as any)}
            isDestructive={true}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8FBF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  destructiveIconBox: {
    backgroundColor: '#FFEAEA',
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1B1E',
  },
  menuSublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  destructiveLabel: {
    color: '#FF5252',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#CCC',
  },
});
