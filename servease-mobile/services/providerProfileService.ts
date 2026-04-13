import { api } from '../lib/apiClient';
import { ProviderProfile } from '../src/types/database.interfaces';

export type ProviderProfileDraft = Partial<ProviderProfile> & {
  trust_score?: number;
};

export const getDefaultProviderProfileDraft = (): ProviderProfileDraft => ({
  business_name: '',
  bio: '',
  years_experience: '0',
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

