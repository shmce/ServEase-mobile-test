import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MessageItem = ({ id, initials, name, message, time, unreadCount, onPress }: any) => (
  <TouchableOpacity style={styles.messageCard} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.avatarContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
    <View style={styles.messageContent}>
      <View style={styles.messageHeader}>
        <Text style={styles.customerName}>{name}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={styles.messageFooter}>
        <Text style={styles.messageSnippet} numberOfLines={1}>{message}</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export default function MessagesScreen() {
  const router = useRouter();

  const navigateToChat = (id: string, name: string, initials: string) => {
    router.push({
      pathname: '/provider-chat',
      params: { id, name, initials }
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            <MessageItem 
              id="john"
              initials="JS" 
              name="John Smith" 
              message="Hi! What time will you arrive today?" 
              time="2 min ago" 
              unreadCount={2} 
              onPress={() => navigateToChat('john', 'John Smith', 'JS')}
            />
            <MessageItem 
              id="sarah"
              initials="SJ" 
              name="Sarah Johnson" 
              message="Thank you for the great service!" 
              time="1 hour ago" 
              unreadCount={0} 
              onPress={() => navigateToChat('sarah', 'Sarah Johnson', 'SJ')}
            />
            <MessageItem 
              id="mike"
              initials="MD" 
              name="Mike Davis" 
              message="Can you bring extra tools?" 
              time="3 hours ago" 
              unreadCount={1} 
              onPress={() => navigateToChat('mike', 'Mike Davis', 'MD')}
            />
            <MessageItem 
              id="anna"
              initials="AR" 
              name="Anna Reyes" 
              message="Perfect! See you tomorrow." 
              time="Yesterday" 
              unreadCount={0} 
              onPress={() => navigateToChat('anna', 'Anna Reyes', 'AR')}
            />
            <MessageItem 
              id="pedro"
              initials="PG" 
              name="Pedro Garcia" 
              message="How much will the materials cost?" 
              time="2 days ago" 
              unreadCount={0} 
              onPress={() => navigateToChat('pedro', 'Pedro Garcia', 'PG')}
            />
          </View>
          <View style={styles.footerSpacer} />
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
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00B761',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  timeText: {
    fontSize: 12,
    color: '#AAA',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageSnippet: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00B761',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 40,
  },
});
