import { api } from '../lib/apiClient';

export const getUserProfile = async () => {
  return api.get<{
    id: string;
    full_name: string;
    email: string;
    contact_number: string;
    role: string;
    status: string;
  }>('/users/profile');
};

export const updateUserProfile = async (updates: {
  full_name?: string;
  contact_number?: string;
}) => {
  return api.patch('/users/profile', updates);
};
