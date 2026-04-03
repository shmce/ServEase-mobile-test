# Design Spec: Secure Authentication Storage

Implementing a robust, encrypted, and resilient authentication storage mechanism using `expo-secure-store` for the ServEase mobile application.

## Problem Statement
The current implementation using `@react-native-async-storage/async-storage` is failing in Expo Go with the error **"native module is null, cannot access legacy storage."** This is likely due to a version mismatch or missing native module support in the current environment. Additionally, `AsyncStorage` is unencrypted and not recommended for sensitive data like authentication tokens.

## Goals
- **Fix Runtime Error**: Resolve the "native module is null" crash by switching to a more stable, Expo-managed storage library.
- **Enhance Security**: Encrypt stored sessions using the device's native Keychain (iOS) and Keystore (Android).
- **Persistent Session**: Ensure the user remains logged in after app restarts and phone reboots.
- **Resilient Fallback**: Provide a memory-based fallback if the native secure storage fails to prevent crashes in restricted environments.

## Proposed Changes

### 1. Dependency Update
Install `expo-secure-store` using the Expo CLI to ensure compatibility with SDK 54.

```bash
npx expo install expo-secure-store
```

### 2. Secure Auth Adapter
Modify `frontend/lib/supabase.ts` to replace the `AsyncStorage` logic with a `SecureStoreAdapter`.

#### Key Chunking (Future-proofing)
`SecureStore` has a 2048-byte limit per key. While most Supabase sessions fit, I'll structure the adapter to handle basic persistence.

#### Implementation Logic
```typescript
import * as SecureStore from 'expo-secure-store';

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStore.delete(key);
    }
  }
};
```

## Success Criteria
- [ ] No more "native module is null" error on login.
- [ ] User session persists after closing and reopening the app.
- [ ] App stays functional in "memory-only" mode if SecureStore is unavailable.

## Verification Plan

### Manual Verification
1.  **Sign In**: Open the app in Expo Go, navigate to login, and sign in.
2.  **Verify State**: Check if the app transitions to the home screen.
3.  **Persistence Check**: Force close the app and reopen it to ensure the user is still logged in.
4.  **Error Handling**: Mock a `SecureStore` failure in a test environment to verify memory fallback.
