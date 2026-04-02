import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://strtoeeidqnsmbszhjhe.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cnRvZWVpZHFuc21ic3poamhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTc2MzksImV4cCI6MjA4OTkzMzYzOX0.nlyLYzTvpw1bUZy8hdK4WDmdsbr86vAcaINAQ8wvPoE';

// SSR-safe storage wrapper for Web and resilient fallback for Expo Go/native module issues.
const isWebSSR = Platform.OS === 'web' && (typeof window === 'undefined' || !window.localStorage);
const memoryStore = new Map<string, string>();

const hasAsyncStorage =
  !!AsyncStorage &&
  typeof (AsyncStorage as any).getItem === 'function' &&
  typeof (AsyncStorage as any).setItem === 'function' &&
  typeof (AsyncStorage as any).removeItem === 'function';

const readMemory = (key: string) => Promise.resolve(memoryStore.get(key) ?? null);
const writeMemory = (key: string, value: string) => {
  memoryStore.set(key, value);
  return Promise.resolve();
};
const removeMemory = (key: string) => {
  memoryStore.delete(key);
  return Promise.resolve();
};

const customStorage = {
  getItem: async (key: string) => {
    if (isWebSSR) return Promise.resolve(null);
    if (!hasAsyncStorage) return readMemory(key);
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return readMemory(key);
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWebSSR) return Promise.resolve();
    if (!hasAsyncStorage) return writeMemory(key, value);
    try {
      return await AsyncStorage.setItem(key, value);
    } catch {
      return writeMemory(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (isWebSSR) return Promise.resolve();
    if (!hasAsyncStorage) return removeMemory(key);
    try {
      return await AsyncStorage.removeItem(key);
    } catch {
      return removeMemory(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
