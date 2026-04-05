import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal,
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  SafeAreaView, 
  StatusBar, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const ChatScreen = () => {
  const router = useRouter();
  const { id: providerId, providerName, serviceName } = useLocalSearchParams<{
    id?: string;
    providerName?: string;
    serviceName?: string;
  }>();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [providerProfile, setProviderProfile] = useState<any>(null);

  useEffect(() => {
    async function setupChat() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user && providerId) {
        // Fetch provider profile for avatar/details
        const { data: pData } = await supabase
          .from('provider_profiles')
          .select('*, user_profiles(full_name, avatar_url)')
          .eq('id', providerId)
          .single();
        
        setProviderProfile(pData);

        // Fetch existing messages
        const { data: mData, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${providerId}),and(sender_id.eq.${providerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (mData) {
          setMessages(mData.map(m => ({
            id: m.id,
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: m.sender_id === user.id ? 'customer' : 'provider'
          })));
        }
        setIsLoading(false);

        // Subscribe to real-time changes
        const channel = supabase
          .channel(`chat:${providerId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages' 
          }, (payload) => {
            const newMessage = payload.new;
            if ((newMessage.sender_id === providerId && newMessage.receiver_id === user.id) ||
                (newMessage.sender_id === user.id && newMessage.receiver_id === providerId)) {
              setMessages(prev => [...prev, {
                id: newMessage.id,
                text: newMessage.content,
                time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: newMessage.sender_id === user.id ? 'customer' : 'provider'
              }]);
              
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }

    setupChat();
  }, [providerId]);

  useEffect(() => {
    // Scroll to bottom when messages change or loading finishes
    if (!isLoading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [isLoading, messages.length]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || !currentUser || !providerId) return;
    
    const textToSend = inputText;
    setInputText('');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: providerId,
        content: textToSend,
      });

    if (error) {
      console.error('Error sending message:', error);
      // Optional: show error to user
    }
  };

  const isSendReady = inputText.trim().length > 0;

  const handleViewProfile = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/provider-profile',
      params: {
        providerId: providerId || '1',
        providerName: providerName,
        serviceName: serviceName,
      },
    });
  };

  const handleReportProfile = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/customer-report-profile',
      params: {
        providerName: providerName,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1B1E" />
        </TouchableOpacity>
        
        <View style={styles.providerInfo}>
          <View>
            <Image 
              source={{ uri: providerProfile?.user_profiles?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=60' }} 
              style={styles.avatar} 
            />
            {(providerProfile?.is_available ?? true) && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{providerName || providerProfile?.user_profiles?.full_name || 'Service Provider'}</Text>
            <Text style={styles.category}>{serviceName || 'Service'}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call-outline" size={24} color="#00C853" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam-outline" size={24} color="#00C853" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#1A1B1E" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg: any) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageContainer, 
                msg.sender === 'customer' ? styles.customerMessageContainer : styles.providerMessageContainer
              ]}
            >
              <View 
                style={[
                  styles.messageBubble, 
                  msg.sender === 'customer' ? styles.customerBubble : styles.providerBubble
                ]}
              >
                <Text style={[
                  styles.messageText, 
                  msg.sender === 'customer' ? styles.customerText : styles.providerText
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.messageTime, 
                  msg.sender === 'customer' ? styles.customerTime : styles.providerTime
                ]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, !isSendReady && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!isSendReady}
          >
            <Ionicons name="paper-plane" size={20} color={isSendReady ? "#FFF" : "#BABABA"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewProfile}>
              <Ionicons name="person-outline" size={18} color="#0D1B2A" />
              <Text style={styles.menuItemText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleReportProfile}>
              <Ionicons name="flag-outline" size={18} color="#FF5252" />
              <Text style={[styles.menuItemText, styles.reportText]}>Report Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  nameContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1B1E',
  },
  category: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  keyboardView: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  messageList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  providerMessageContainer: {
    alignSelf: 'flex-start',
  },
  customerMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  providerBubble: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
  },
  customerBubble: {
    backgroundColor: '#00C853',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  providerText: {
    color: '#1A1B1E',
  },
  customerText: {
    color: '#FFF',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  providerTime: {
    color: '#BBB',
  },
  customerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  input: {
    fontSize: 15,
    color: '#333',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F8F9FA',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 84,
    paddingRight: 18,
  },
  menuSheet: {
    width: 180,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
    marginLeft: 10,
  },
  reportText: {
    color: '#FF5252',
  },
});
