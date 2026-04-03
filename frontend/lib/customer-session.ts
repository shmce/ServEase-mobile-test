import { useSyncExternalStore } from 'react';
import { supabase, identityDb } from './db';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from './error-handling';
import { Storage } from './storage';

export type CustomerProfile = {
  fullName: string;
  mobileNumber: string;
  referralCode: string;
};

export type CustomerAddress = {
  label: string;
  streetAddress: string;
  barangay: string;
  province: string;
  city: string;
  postalCode: string;
  locationNote: string;
  isDefault: boolean;
};

type PendingCustomerDraft = {
  email: string;
  profile: CustomerProfile;
  address: CustomerAddress | null;
};

type CustomerSessionSnapshot = {
  pendingCustomer: PendingCustomerDraft | null;
};

const STORAGE_KEY = 'customer-pending-onboarding';
const listeners = new Set<() => void>();

let snapshot: CustomerSessionSnapshot = {
  pendingCustomer: null,
};
let hasLoadedDraft = false;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: CustomerSessionSnapshot) {
  snapshot = next;
  emitChange();
}

async function loadPendingDraft() {
  if (hasLoadedDraft) return;
  hasLoadedDraft = true;

  try {
    const parsed = await Storage.getJson<PendingCustomerDraft>(STORAGE_KEY);
    if (parsed?.email && parsed?.profile) {
      snapshot = { pendingCustomer: parsed };
    }
  } catch {
    snapshot = { pendingCustomer: null };
  }
}

async function persistPendingDraft(nextDraft: PendingCustomerDraft | null) {
  if (!nextDraft) {
    await Storage.removeItem(STORAGE_KEY);
    setSnapshot({ pendingCustomer: null });
    return;
  }

  await Storage.setJson(STORAGE_KEY, nextDraft);
  setSnapshot({ pendingCustomer: nextDraft });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadPendingDraft().then(() => emitChange());
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

async function persistCustomerToDatabase(userId: string, email: string, profile: CustomerProfile) {
  const fullName = profile.fullName.trim() || email.split('@')[0] || 'Customer';
  const contactNumber = profile.mobileNumber.trim();

  try {
    await identityDb.from('users').upsert({
      id: userId,
      email,
      full_name: fullName,
      contact_number: contactNumber,
      role: 'customer',
    });
  } catch {}
}

export function useCustomerSession() {
  const localSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { user } = useAuth();

  const currentCustomer = user
    ? {
        email: String(user.email || '').trim().toLowerCase(),
        signupName:
          String(user.user_metadata?.full_name || '').trim() ||
          String(user.email || '').split('@')[0] ||
          'Customer',
        profile: {
          fullName:
            String(user.user_metadata?.full_name || '').trim() ||
            String(user.email || '').split('@')[0] ||
            'Customer',
          mobileNumber: String(user.user_metadata?.phone || '').trim(),
          referralCode: String(user.user_metadata?.referral_code || '').trim(),
        },
      }
    : null;

  return {
    currentCustomer,
    pendingCustomer: localSnapshot.pendingCustomer,
    isLoggedIn: !!user,
    isInSignupOnboarding: Boolean(localSnapshot.pendingCustomer),
  };
}

export async function registerCustomerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  referralCode: string;
}) {
  const email = input.email.trim().toLowerCase();
  const profile: CustomerProfile = {
    fullName: input.fullName.trim(),
    mobileNumber: input.phone.trim(),
    referralCode: input.referralCode.trim(),
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: 'customer',
        full_name: profile.fullName,
        phone: profile.mobileNumber,
        referral_code: profile.referralCode,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to create customer account.'));
  }

  await persistPendingDraft({
    email,
    profile,
    address: null,
  });

  if (data.user?.id) {
    await persistCustomerToDatabase(data.user.id, email, profile);
  }
}

export async function savePendingCustomerAddress(address: CustomerAddress) {
  await loadPendingDraft();
  const existing = snapshot.pendingCustomer;
  if (!existing) return;

  await persistPendingDraft({
    ...existing,
    address,
  });
}

export async function finishSignupOnboarding() {
  await persistPendingDraft(null);
}

export async function loginCustomer(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: password.trim(),
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to log in.'));
  }

  if (data.user?.id) {
    const profile: CustomerProfile = {
      fullName:
        String(data.user.user_metadata?.full_name || '').trim() ||
        normalizedEmail.split('@')[0] ||
        'Customer',
      mobileNumber: String(data.user.user_metadata?.phone || '').trim(),
      referralCode: String(data.user.user_metadata?.referral_code || '').trim(),
    };
    await persistCustomerToDatabase(data.user.id, normalizedEmail, profile);
  }

  await finishSignupOnboarding();

  return { ok: true as const };
}

export async function logoutCustomer() {
  await supabase.auth.signOut();
}
