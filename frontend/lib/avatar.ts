import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

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
 * Opens the image picker, uploads the selected image to Supabase Storage,
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
  const filePath = `${userId}.jpg`;

  // Read the file as blob for upload
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  // ArrayBuffer is needed for supabase-js upload
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    Alert.alert('Upload Failed', error.message);
    return null;
  }

  return `${getAvatarUrl(userId)}?t=${Date.now()}`;
}
