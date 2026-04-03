import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://strtoeeidqnsmbszhjhe.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cnRvZWVpZHFuc21ic3poamhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTc2MzksImV4cCI6MjA4OTkzMzYzOX0.nlyLYzTvpw1bUZy8hdK4WDmdsbr86vAcaINAQ8wvPoE';

// SecureStore has a 2048-byte limit per key. We use a memory store as a fallback for SSR or restricted environments.
const isWebSSR = Platform.OS === 'web' && (typeof window === 'undefined' || !window.localStorage);
const memoryStore = new Map<string, string>();

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (isWebSSR) return Promise.resolve(null);
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWebSSR) return Promise.resolve();
    
    // SecureStore Limit (2048 bytes). Most sessions fit, but we fallback if it fails.
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (isWebSSR) return Promise.resolve();
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
