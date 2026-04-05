import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const ChatBubble = ({ text, time, sender }: any) => (
  <View style={[styles.bubbleContainer, sender === 'provider' ? styles.providerBubbleContainer : styles.customerBubbleContainer]}>
    <View style={[styles.bubble, sender === 'provider' ? styles.providerBubble : styles.customerBubble]}>
      <Text style={[styles.bubbleText, sender === 'provider' ? styles.providerBubbleText : styles.customerBubbleText]}>
        {text}
      </Text>
      <Text style={[styles.bubbleTime, sender === 'provider' ? styles.providerBubbleTime : styles.customerBubbleTime]}>
        {time}
      </Text>
    </View>
  </View>
);

export default function ProviderChatScreen() {
  const router = useRouter();
  const { id: customerId, name: customerName, initials } = useLocalSearchParams<{
    id: string;
    name: string;
    initials: string;
  }>();
  
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function setupChat() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user && customerId) {
        // Fetch existing messages
        const { data: mData } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${customerId}),and(sender_id.eq.${customerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (mData) {
          setMessages(mData.map(m => ({
            id: m.id,
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: m.sender_id === user.id ? 'provider' : 'customer'
          })));
        }
        setIsLoading(false);

        // Subscribe to real-time additions
        const channel = supabase
          .channel(`provider_chat:${customerId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages' 
          }, (payload) => {
            const newMessage = payload.new;
            if ((newMessage.sender_id === customerId && newMessage.receiver_id === user.id) ||
                (newMessage.sender_id === user.id && newMessage.receiver_id === customerId)) {
              setMessages(prev => [...prev, {
                id: newMessage.id,
                text: newMessage.content,
                time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: newMessage.sender_id === user.id ? 'provider' : 'customer'
              }]);
            }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }

    setupChat();
  }, [customerId]);

  const handleSend = async () => {
    if (messageText.trim().length === 0 || !currentUser || !customerId) return;
    
    const textToSend = messageText;
    setMessageText('');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: customerId,
        content: textToSend,
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{String(initials || 'C')}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{String(customerName || 'Customer')}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#AAA" />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={true}
          >
            {messages.map((msg: any) => (
              <ChatBubble key={msg.id} {...msg} />
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={24} color="#777" />
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#AAA"
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
            </View>
            <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
              <Ionicons name="send" size={20} color="#00B761" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8FBF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B761',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  headerStatus: {
    fontSize: 12,
    color: '#00B761',
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  chatScroll: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
  },
  bubbleContainer: {
    marginBottom: 16,
    width: '100%',
    flexDirection: 'row',
  },
  customerBubbleContainer: {
    justifyContent: 'flex-start',
  },
  providerBubbleContainer: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  customerBubble: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
  },
  providerBubble: {
    backgroundColor: '#00B761',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  customerBubbleText: {
    color: '#0D1B2A',
  },
  providerBubbleText: {
    color: '#FFF',
  },
  bubbleTime: {
    fontSize: 10,
    textAlign: 'right',
  },
  customerBubbleTime: {
    color: '#AAA',
  },
  providerBubbleTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attachButton: {
    padding: 8,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    borderRadius: 24,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: '#0D1B2A',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
