import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWebSSR = Platform.OS === 'web' && !globalThis.window?.localStorage;
const memoryStore = new Map<string, string>();

/**
 * SecureStore has a hard 2048-byte limit per key.
 * Values larger than this are split into numbered chunks:
 *   key        → JSON metadata: { chunks: N }
 *   key_chunk_0, key_chunk_1, … → the actual data slices
 */
const CHUNK_SIZE = 1800; // safely under the 2048-byte limit
const CHUNK_META_SUFFIX = '__meta';
const CHUNK_SUFFIX = '__chunk_';

async function setChunked(key: string, value: string): Promise<void> {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  // Write all chunk keys
  await Promise.all(
    chunks.map((chunk, idx) =>
      SecureStore.setItemAsync(`${key}${CHUNK_SUFFIX}${idx}`, chunk)
    )
  );
  // Write metadata last (used as the presence check)
  await SecureStore.setItemAsync(
    `${key}${CHUNK_META_SUFFIX}`,
    JSON.stringify({ chunks: chunks.length })
  );
}

async function getChunked(key: string): Promise<string | null> {
  const metaRaw = await SecureStore.getItemAsync(`${key}${CHUNK_META_SUFFIX}`);
  if (!metaRaw) return null;
  try {
    const { chunks } = JSON.parse(metaRaw) as { chunks: number };
    const parts = await Promise.all(
      Array.from({ length: chunks }, (_, idx) =>
        SecureStore.getItemAsync(`${key}${CHUNK_SUFFIX}${idx}`)
      )
    );
    if (parts.some((p) => p === null)) return null;
    return parts.join('');
  } catch {
    return null;
  }
}

async function deleteChunked(key: string): Promise<void> {
  const metaRaw = await SecureStore.getItemAsync(`${key}${CHUNK_META_SUFFIX}`);
  if (metaRaw) {
    try {
      const { chunks } = JSON.parse(metaRaw) as { chunks: number };
      await Promise.all(
        Array.from({ length: chunks }, (_, idx) =>
          SecureStore.deleteItemAsync(`${key}${CHUNK_SUFFIX}${idx}`)
        )
      );
    } catch { /* ignore */ }
    await SecureStore.deleteItemAsync(`${key}${CHUNK_META_SUFFIX}`);
  }
}

/**
 * Unified Storage Utility for ServEase
 * Uses SecureStore for native platforms with automatic chunking for values
 * larger than 2048 bytes. Falls back to an in-memory store for SSR/restricted
 * environments.
 */
export const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWebSSR) return null;
    try {
      // Check for chunked data first, then fall back to plain key
      const meta = await SecureStore.getItemAsync(`${key}${CHUNK_META_SUFFIX}`);
      if (meta) return getChunked(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isWebSSR) return;
    try {
      if (value.length > CHUNK_SIZE) {
        // Remove any previous plain-key entry before writing chunks
        await SecureStore.deleteItemAsync(key).catch(() => undefined);
        await setChunked(key, value);
      } else {
        // Remove any leftover chunk data before writing plain
        await deleteChunked(key).catch(() => undefined);
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      memoryStore.set(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (isWebSSR) return;
    try {
      await deleteChunked(key);
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
