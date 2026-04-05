import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const MenuItem = ({ icon, label, onPress, isDestructive }: any) => (
  <TouchableOpacity 
    style={styles.menuItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, isDestructive && styles.destructiveIconBackground]}>
      <Ionicons name={icon} size={22} color={isDestructive ? '#FF4D4D' : '#00B761'} />
    </View>
    <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
    {!isDestructive && (
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    )}
  </TouchableOpacity>
);

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Call signOut from AuthContext
      await signOut();
      
      // Redirect to login page after successful logout
      router.replace('/provider-login' as any);
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message || 'Failed to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.menuList}>
            <MenuItem 
              icon="person-outline" 
              label="My Profile" 
              onPress={() => router.push('/provider-my-profile' as any)} 
            />
            <MenuItem 
              icon="options-outline" 
              label="Settings" 
              onPress={() => router.push('/provider-settings' as any)} 
            />
            <MenuItem 
              icon="time-outline" 
              label="View Schedule" 
              onPress={() => router.push('/provider-availability' as any)} 
            />
            <MenuItem 
              icon="help-circle-outline" 
              label="Help & Support" 
              onPress={() => router.push('/provider-help' as any)} 
            />
            <MenuItem 
              icon="time-outline" 
              label="Service History" 
              onPress={() => router.push('/provider-history' as any)} 
            />
            
            <View style={styles.separator} />
            
            <MenuItem 
              icon="log-out-outline" 
              label="Log Out" 
              onPress={handleLogout}
              isDestructive={true}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Outfit-Bold',
  },
  scrollContainer: {
    flex: 1,
  },
  menuList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Matches mockup background for items
    paddingVertical: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destructiveIconBackground: {
    backgroundColor: '#FFE5E5',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  destructiveLabel: {
    color: '#FF4D4D',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
});
