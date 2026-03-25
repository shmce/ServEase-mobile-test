import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const MOCK_CONVERSATIONS: any = {
  john: [
    { id: '1', text: 'Hi! I need help with cleaning my house.', time: '10:30 AM', sender: 'customer' },
    { id: '2', text: 'Hello! I\'d be happy to help. When would you like to schedule the service?', time: '10:32 AM', sender: 'provider' },
    { id: '3', text: 'How about tomorrow at 2 PM?', time: '10:35 AM', sender: 'customer' },
    { id: '4', text: 'That works perfectly! I\'ve confirmed your booking for tomorrow at 2:00 PM.', time: '10:38 AM', sender: 'provider' },
    { id: '5', text: 'Great! What should I prepare?', time: '10:40 AM', sender: 'customer' },
    { id: '6', text: 'Just make sure the area is accessible. I\'ll bring all the cleaning supplies.', time: '10:42 AM', sender: 'provider' },
  ],
  sarah: [
    { id: '1', text: 'I need plumbing service ASAP!', time: '8:00 AM', sender: 'customer' },
    { id: '2', text: 'I can help you today. What\'s the issue?', time: '8:02 AM', sender: 'provider' },
    { id: '3', text: 'My kitchen sink is leaking badly.', time: '8:05 AM', sender: 'customer' },
    { id: '4', text: 'I can come by at 4:30 PM today. Does that work?', time: '8:07 AM', sender: 'provider' },
    { id: '5', text: 'Yes, perfect! See you then.', time: '8:10 AM', sender: 'customer' },
    { id: '6', text: 'Thank you for the great service!', time: '8:15 PM', sender: 'customer' },
  ],
  mike: [
    { id: '1', text: 'I need electrical work done tomorrow.', time: 'Yesterday', sender: 'customer' },
    { id: '2', text: 'Sure! What kind of electrical work?', time: 'Yesterday', sender: 'provider' },
    { id: '3', text: 'Need to install new outlets in my office.', time: 'Yesterday', sender: 'customer' },
    { id: '4', text: 'I can do that! I\'ll be there at 10 AM tomorrow.', time: 'Yesterday', sender: 'provider' },
    { id: '5', text: 'Can you bring extra tools?', time: '8:30 AM', sender: 'customer' },
  ],
  anna: [
    { id: '1', text: 'Hi! Can you do carpentry work?', time: '2 days ago', sender: 'customer' },
    { id: '2', text: 'Yes, I specialize in carpentry. What do you need?', time: '2 days ago', sender: 'provider' },
    { id: '3', text: 'I need custom shelves built in my bedroom.', time: '2 days ago', sender: 'customer' },
    { id: '4', text: 'I can do that! When would you like me to start?', time: '2 days ago', sender: 'provider' },
    { id: '5', text: 'How about tomorrow at 2 PM?', time: '2 days ago', sender: 'customer' },
    { id: '6', text: 'Perfect! See you tomorrow.', time: '2 days ago', sender: 'provider' },
  ],
  pedro: [
    { id: '1', text: 'I need my house painted.', time: '3 days ago', sender: 'customer' },
    { id: '2', text: 'I can help with that! How many rooms?', time: '3 days ago', sender: 'provider' },
    { id: '3', text: '3 bedrooms and the living room.', time: '3 days ago', sender: 'customer' },
    { id: '4', text: 'Great! I can start on March 15 at 9 AM.', time: '3 days ago', sender: 'provider' },
    { id: '5', text: 'How much will the materials cost?', time: '2 days ago', sender: 'customer' },
  ],
};

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
  const { id, name, initials } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const messages = MOCK_CONVERSATIONS[id as string] || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name}</Text>
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

