import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MESSAGES_DATA = [
  {
    id: '1',
    text: 'Hi! I have some questions about the plumbing repair.',
    time: '10:30 AM',
    sender: 'customer',
  },
  {
    id: '2',
    text: 'Hello! Sure, I\'d be happy to help. What would you like to know?',
    time: '10:32 AM',
    sender: 'provider',
  },
  {
    id: '3',
    text: 'Will you need to shut off the water main?',
    time: '10:35 AM',
    sender: 'customer',
  },
  {
    id: '4',
    text: 'Yes, I\'ll need to shut it off temporarily while I work on the pipe. It should only be for about 30 minutes.',
    time: '10:37 AM',
    sender: 'provider',
  },
  {
    id: '5',
    text: 'Okay, that sounds good. See you tomorrow!',
    time: '10:40 AM',
    sender: 'customer',
  },
];

const MessageBubble = ({ text, time, sender }: { text: string, time: string, sender: string }) => (
  <View style={[
    styles.messageContainer, 
    sender === 'provider' ? styles.providerContainer : styles.customerContainer
  ]}>
    <View style={[
      styles.bubble, 
      sender === 'provider' ? styles.providerBubble : styles.customerBubble
    ]}>
      <Text style={[
        styles.messageText, 
        sender === 'provider' ? styles.providerText : styles.customerText
      ]}>{text}</Text>
      <Text style={[
        styles.timestamp, 
        sender === 'provider' ? styles.providerTimestamp : styles.customerTimestamp
      ]}>{time}</Text>
    </View>
  </View>
);

export default function ProviderMessagingScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D1B2A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Booking #1</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.chatArea} 
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {MESSAGES_DATA.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              text={msg.text} 
              time={msg.time} 
              sender={msg.sender} 
            />
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#AAA"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="paper-plane" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  customerContainer: {
    alignSelf: 'flex-start',
  },
  providerContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  customerBubble: {
    backgroundColor: '#F2F3F5',
    borderTopLeftRadius: 4,
  },
  providerBubble: {
    backgroundColor: '#00B761',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  customerText: {
    color: '#0D1B2A',
  },
  providerText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  customerTimestamp: {
    color: '#AAA',
  },
  providerTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    color: '#0D1B2A',
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#99E6C3', // Lighter green for send button as in mockup
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B761',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

