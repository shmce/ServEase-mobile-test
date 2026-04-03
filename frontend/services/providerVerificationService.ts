import { Storage } from '../lib/storage';
import { providerCatalogDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';

export type VerificationStatus = 'not_started' | 'draft' | 'submitted' | 'approved' | 'rejected';
export type VerificationLevel = 'unverified' | 'basic_verified' | 'fully_verified' | 'premium_verified';

export type ProviderVerificationDraft = {
  businessName: string;
  governmentIdType: string;
  governmentIdNumber: string;
  nbiClearanceNumber: string;
  prcLicenseNumber: string;
  businessPermitNumber: string;
  tinNumber: string;
  proofOfAddressNotes: string;
  serviceAreas: string[];
  languages: string[];
  yearsExperience: string;
  portfolioSummary: string;
  referenceContacts: string;
  hasInsurance: boolean;
  status: VerificationStatus;
  verificationLevel: VerificationLevel;
  score: number;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
};

const STORAGE_PREFIX = 'provider-verification';

const createEmptyDraft = (): ProviderVerificationDraft => ({
  businessName: '',
  governmentIdType: '',
  governmentIdNumber: '',
  nbiClearanceNumber: '',
  prcLicenseNumber: '',
  businessPermitNumber: '',
  tinNumber: '',
  proofOfAddressNotes: '',
  serviceAreas: [],
  languages: [],
  yearsExperience: '',
  portfolioSummary: '',
  referenceContacts: '',
  hasInsurance: false,
  status: 'not_started',
  verificationLevel: 'unverified',
  score: 0,
  submittedAt: null,
  lastUpdatedAt: null,
});

const getStorageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`;

const normalizeArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];

const normalizeStatus = (statusRaw?: string | null): VerificationStatus => {
  const status = String(statusRaw || '').trim().toLowerCase();
  if (status.includes('approve')) return 'approved';
  if (status.includes('reject')) return 'rejected';
  if (status.includes('submit') || status.includes('review')) return 'submitted';
  if (status.includes('draft') || status.includes('progress')) return 'draft';
  return 'not_started';
};

export const formatVerificationStatusLabel = (statusRaw: VerificationStatus | string) => {
  const status = normalizeStatus(statusRaw);
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Needs attention';
  if (status === 'submitted') return 'Under review';
  if (status === 'draft') return 'Draft saved';
  return 'Not started';
};

export const formatVerificationLevelLabel = (level: VerificationLevel) => {
  if (level === 'premium_verified') return 'Premium Verified';
  if (level === 'fully_verified') return 'Fully Verified';
  if (level === 'basic_verified') return 'Basic Verified';
  return 'Unverified';
};

export const assessProviderVerification = (
  draftInput: Partial<ProviderVerificationDraft>
): Pick<ProviderVerificationDraft, 'score' | 'verificationLevel'> => {
  let score = 0;

  if (draftInput.governmentIdType && draftInput.governmentIdNumber) score += 20;
  if (draftInput.nbiClearanceNumber) score += 20;
  if (draftInput.prcLicenseNumber) score += 10;
  if (draftInput.businessPermitNumber) score += 10;
  if (draftInput.tinNumber) score += 10;
  if ((draftInput.serviceAreas || []).length > 0) score += 5;
  if ((draftInput.languages || []).length > 0) score += 5;
  if (draftInput.yearsExperience) score += 8;
  if (draftInput.portfolioSummary) score += 5;
  if (draftInput.referenceContacts) score += 5;
  if (draftInput.proofOfAddressNotes) score += 2;
  if (draftInput.hasInsurance) score += 5;

  let verificationLevel: VerificationLevel = 'unverified';
  const hasBasic = Boolean(draftInput.governmentIdType && draftInput.governmentIdNumber && draftInput.nbiClearanceNumber);
  const hasFull = hasBasic && Boolean(draftInput.businessPermitNumber && draftInput.tinNumber);
  const hasPremium = hasFull && Boolean(draftInput.hasInsurance && draftInput.portfolioSummary);

  if (hasPremium) verificationLevel = 'premium_verified';
  else if (hasFull) verificationLevel = 'fully_verified';
  else if (hasBasic) verificationLevel = 'basic_verified';

  return { score, verificationLevel };
};

const readLocalDraft = async (userId: string) => {
  return await Storage.getJson<Partial<ProviderVerificationDraft>>(getStorageKey(userId));
};

const writeLocalDraft = async (userId: string, draft: ProviderVerificationDraft) => {
  await Storage.setJson(getStorageKey(userId), draft);
};

export const getProviderVerificationDraft = async (userId: string) => {
  const base = createEmptyDraft();
  const local = await readLocalDraft(userId);

  let remoteProfile: any = null;
  try {
    const { data, error } = await providerCatalogDb
      .from('provider_profiles')
      .select('user_id,business_name,verification_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    remoteProfile = data;
  } catch {
    remoteProfile = null;
  }

  const merged: ProviderVerificationDraft = {
    ...base,
    ...local,
    businessName: String(local?.businessName || remoteProfile?.business_name || ''),
    governmentIdType: String(local?.governmentIdType || ''),
    governmentIdNumber: String(local?.governmentIdNumber || ''),
    nbiClearanceNumber: String(local?.nbiClearanceNumber || ''),
    prcLicenseNumber: String(local?.prcLicenseNumber || ''),
    businessPermitNumber: String(local?.businessPermitNumber || ''),
    tinNumber: String(local?.tinNumber || ''),
    proofOfAddressNotes: String(local?.proofOfAddressNotes || ''),
    serviceAreas: normalizeArray(local?.serviceAreas),
    languages: normalizeArray(local?.languages),
    yearsExperience: String(local?.yearsExperience || ''),
    portfolioSummary: String(local?.portfolioSummary || ''),
    referenceContacts: String(local?.referenceContacts || ''),
    hasInsurance: Boolean(local?.hasInsurance),
    status: normalizeStatus(local?.status || remoteProfile?.verification_status),
    submittedAt: local?.submittedAt || null,
    lastUpdatedAt: local?.lastUpdatedAt || null,
  };

  const assessment = assessProviderVerification(merged);
  return {
    ...merged,
    ...assessment,
  };
};

export const saveProviderVerificationDraft = async (
  userId: string,
  input: Partial<ProviderVerificationDraft>,
  options?: { submit?: boolean }
) => {
  const existing = await getProviderVerificationDraft(userId);
  const now = new Date().toISOString();

  const merged: ProviderVerificationDraft = {
    ...existing,
    ...input,
    businessName: String(input.businessName ?? existing.businessName).trim(),
    governmentIdType: String(input.governmentIdType ?? existing.governmentIdType).trim(),
    governmentIdNumber: String(input.governmentIdNumber ?? existing.governmentIdNumber).trim(),
    nbiClearanceNumber: String(input.nbiClearanceNumber ?? existing.nbiClearanceNumber).trim(),
    prcLicenseNumber: String(input.prcLicenseNumber ?? existing.prcLicenseNumber).trim(),
    businessPermitNumber: String(input.businessPermitNumber ?? existing.businessPermitNumber).trim(),
    tinNumber: String(input.tinNumber ?? existing.tinNumber).trim(),
    proofOfAddressNotes: String(input.proofOfAddressNotes ?? existing.proofOfAddressNotes).trim(),
    serviceAreas: normalizeArray(input.serviceAreas ?? existing.serviceAreas),
    languages: normalizeArray(input.languages ?? existing.languages),
    yearsExperience: String(input.yearsExperience ?? existing.yearsExperience).trim(),
    portfolioSummary: String(input.portfolioSummary ?? existing.portfolioSummary).trim(),
    referenceContacts: String(input.referenceContacts ?? existing.referenceContacts).trim(),
    hasInsurance: Boolean(input.hasInsurance ?? existing.hasInsurance),
    status: options?.submit ? 'submitted' : existing.status === 'not_started' ? 'draft' : existing.status,
    submittedAt: options?.submit ? now : existing.submittedAt,
    lastUpdatedAt: now,
    score: 0,
    verificationLevel: 'unverified',
  };

  const assessment = assessProviderVerification(merged);
  const nextDraft = {
    ...merged,
    ...assessment,
  };

  try {
    const { error } = await providerCatalogDb.from('provider_profiles').upsert({
      user_id: userId,
      business_name: nextDraft.businessName || null,
      verification_status: nextDraft.status,
    });

    if (error) throw error;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to sync verification status.'));
  }

  await writeLocalDraft(userId, nextDraft);
  return nextDraft;
};
