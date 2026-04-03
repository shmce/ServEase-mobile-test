import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWebSSR = Platform.OS === 'web' && (globalThis.window === undefined || !globalThis.window?.localStorage);
const memoryStore = new Map<string, string>();

/**
 * Unified Storage Utility for ServEase
 * Uses SecureStore for native platforms and memory fallback for SSR/Restricted environments.
 * Note: SecureStore has a 2048-byte limit per key.
 */
export const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWebSSR) return null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWebSSR) return;
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (isWebSSR) return;
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStore.delete(key);
    }
  },

  /**
   * Helper for non-string data (JSON)
   */
  getJson: async <T>(key: string): Promise<T | null> => {
    const data = await Storage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  setJson: async (key: string, value: any): Promise<void> => {
    await Storage.setItem(key, JSON.stringify(value));
  }
};
