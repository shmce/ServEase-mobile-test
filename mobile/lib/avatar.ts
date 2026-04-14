import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import { api } from './apiClient';

const BUCKET = 'avatars';

/**
 * Returns the public URL for a user's avatar (deterministic path).
 * Append a cache-buster when displaying to avoid stale images.
 */
export function getAvatarUrl(userId: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${userId}.jpg`);
  return data.publicUrl;
}

/**
 * Opens the image picker, uploads the selected image via the API,
 * and returns the public URL. Returns null if the user cancelled.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as any);

  try {
    const { avatar_url } = await api.postForm<{ avatar_url: string }>('/uploads/avatar', formData);
    return avatar_url ?? null;
  } catch (err) {
    Alert.alert('Upload Failed', (err as Error).message || 'Could not upload avatar.');
    return null;
  }
}
