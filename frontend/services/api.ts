import { identityDb } from '../lib/db';

// This is an example of a service layer function.
// Replace this with your actual queries to keep them out of UI components.
export const getUserProfile = async (userId: string) => {
  const { data, error } = await identityDb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  return data;
};
