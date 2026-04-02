import { api } from '../lib/apiClient';

export type ProviderProfileDraft = {
  user_id?: string;
  business_name?: string;
  bio?: string;
  years_experience?: number;
  tags?: string[];
  service_area?: string;
  verification_status?: string;
  average_rating?: number;
  total_reviews?: number;
  trust_score?: number;
  [key: string]: any;
};

export const getDefaultProviderProfileDraft = (): ProviderProfileDraft => ({
  business_name: '',
  bio: '',
  years_experience: 0,
  tags: [],
  service_area: '',
});

export const getProviderProfileDraft = async (userId: string): Promise<ProviderProfileDraft> => {
  const { draft } = await api.get<{ draft: ProviderProfileDraft | null }>(`/provider/${userId}/profile-draft`);
  return draft ?? getDefaultProviderProfileDraft();
};

export const saveProviderProfileDraft = async (userId: string, input: ProviderProfileDraft) => {
  const { draft } = await api.patch<{ draft: ProviderProfileDraft }>(`/provider/${userId}/profile-draft`, input);
  return draft;
};

