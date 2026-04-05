import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'booking',
    title: 'New booking request',
    message: 'Juan Dela Cruz requested Plumbing Repair for today at 2:00 PM.',
    time: '2 min ago',
    icon: 'calendar-outline',
    color: '#00B761',
    unread: true,
    cta: 'Review request',
  },
  {
    id: '2',
    type: 'payout',
    title: 'Payout processed',
    message: 'Your weekly payout of P4,850.00 has been released to your selected account.',
    time: '1 hour ago',
    icon: 'wallet-outline',
    color: '#0D1B2A',
    unread: true,
    cta: 'View earnings',
  },
  {
    id: '3',
    type: 'message',
    title: 'New customer message',
    message: 'Maria Santos sent a follow-up question about your availability tomorrow.',
    time: '3 hours ago',
    icon: 'chatbubble-ellipses-outline',
    color: '#00B761',
    unread: false,
    cta: 'Open inbox',
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Profile reminder',
    message: 'Update your availability and pricing to improve your chances of getting booked.',
    time: 'Yesterday',
    icon: 'information-circle-outline',
    color: '#0D1B2A',
    unread: false,
    cta: 'Update profile',
  },
] as const;

export default function ProviderNotificationsScreen() {
  const router = useRouter();

  const handleNotificationPress = (type: (typeof NOTIFICATIONS)[number]['type']) => {
    if (type === 'booking') {
      router.push({ pathname: '/provider-booking-details', params: { id: 'BK-2026-03-002' } } as any);
      return;
    }

    if (type === 'payout') {
      router.push('/provider-earnings' as any);
      return;
    }

    if (type === 'message') {
      router.push('/provider-messages' as any);
      return;
    }

    router.push('/provider-availability' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={() => router.push('/provider-notification-preferences' as any)}
          style={styles.headerAction}
        >
          <Ionicons name="settings-outline" size={22} color="#0D1B2A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {NOTIFICATIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.notificationCard, item.unread && styles.notificationCardUnread]}
            activeOpacity={0.82}
            onPress={() => handleNotificationPress(item.type)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}12` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.notificationTime}>{item.time}</Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
              </View>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <View style={styles.footerRow}>
                <Text style={styles.notificationCta}>{item.cta}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  headerAction: {
    width: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  notificationCardUnread: {
    borderColor: '#D9F5E7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginRight: 10,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  notificationCta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B761',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
});
