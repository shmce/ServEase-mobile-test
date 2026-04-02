import { api } from '../lib/apiClient';

export type UserProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  role: string;
  status: string;
};

export const getProfile = async (_userId: string) => {
  // GET /users/v1/profile uses the auth token — userId param kept for API compat
  return api.get<UserProfileRecord>('/users/profile');
};

export const updateProfile = async (_userId: string, updates: Partial<UserProfileRecord>) => {
  return api.patch<UserProfileRecord>('/users/profile', updates);
};

