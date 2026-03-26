import { identityDb, providerCatalogDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';

export type ProviderProfileDraft = {
  fullName: string;
  businessName: string;
  bio: string;
  serviceAreas: string[];
  languages: string[];
  yearsExperience: string;
  facebookUrl: string;
  instagramHandle: string;
  websiteUrl: string;
  serviceCategories: string[];
};

const splitTags = (input: unknown) =>
  Array.isArray(input)
    ? input.map((value) => String(value || '').trim()).filter(Boolean)
    : String(input || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export const getDefaultProviderProfileDraft = (): ProviderProfileDraft => ({
  fullName: '',
  businessName: '',
  bio: '',
  serviceAreas: [],
  languages: [],
  yearsExperience: '',
  facebookUrl: '',
  instagramHandle: '',
  websiteUrl: '',
  serviceCategories: [],
});

export const getProviderProfileDraft = async (userId: string): Promise<ProviderProfileDraft> => {
  const fallback = getDefaultProviderProfileDraft();

  const [{ data: user }, { data: profile }, { data: services }] = await Promise.all([
    identityDb.from('users').select('id,full_name').eq('id', userId).maybeSingle(),
    providerCatalogDb.from('provider_profiles').select('*').eq('user_id', userId).maybeSingle(),
    providerCatalogDb
      .from('provider_services')
      .select('title,service_categories(name)')
      .eq('provider_id', userId),
  ]);

  const serviceCategories = unique(
    (services || []).flatMap((row: any) => {
      const categoryName = String(row?.service_categories?.name || '').trim();
      return categoryName ? [categoryName] : [];
    })
  );

  return {
    ...fallback,
    fullName: String(user?.full_name || '').trim(),
    businessName: String(profile?.business_name || user?.full_name || '').trim(),
    bio: String(profile?.bio || '').trim(),
    serviceAreas: unique(splitTags(profile?.service_areas)),
    languages: unique(splitTags(profile?.languages)),
    yearsExperience: String(profile?.years_experience || '').trim(),
    facebookUrl: String(profile?.facebook_url || '').trim(),
    instagramHandle: String(profile?.instagram_handle || '').trim(),
    websiteUrl: String(profile?.website_url || '').trim(),
    serviceCategories,
  };
};

export const saveProviderProfileDraft = async (userId: string, input: ProviderProfileDraft) => {
  const normalizedFullName = String(input.fullName || '').trim();
  const normalizedBusinessName = String(input.businessName || normalizedFullName).trim();

  const { error: userError } = await identityDb
    .from('users')
    .update({
      full_name: normalizedFullName || null,
    })
    .eq('id', userId);

  if (userError) {
    throw new Error(getErrorMessage(userError, 'Failed to update provider user profile.'));
  }

  const profilePayload = {
    user_id: userId,
    business_name: normalizedBusinessName || null,
    bio: String(input.bio || '').trim() || null,
    service_areas: unique(input.serviceAreas || []),
    languages: unique(input.languages || []),
    years_experience: String(input.yearsExperience || '').trim() || null,
    facebook_url: String(input.facebookUrl || '').trim() || null,
    instagram_handle: String(input.instagramHandle || '').trim() || null,
    website_url: String(input.websiteUrl || '').trim() || null,
  };

  const { error: profileError } = await providerCatalogDb
    .from('provider_profiles')
    .upsert(profilePayload, { onConflict: 'user_id' });

  if (profileError) {
    throw new Error(getErrorMessage(profileError, 'Failed to update provider profile details.'));
  }
};
