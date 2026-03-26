import { identityDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';

export type UserProfileRecord = {
  id: string; // Matches auth.users
  full_name: string;
  email: string;
  contact_number: string;
  role: string;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await identityDb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(getErrorMessage(error, 'Failed to load profile.'));
  }
  return data as UserProfileRecord | null;
};

export const updateProfile = async (userId: string, updates: Partial<UserProfileRecord>) => {
  const { data, error } = await identityDb
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(getErrorMessage(error, 'Failed to update profile.'));
  }
  return data;
};
