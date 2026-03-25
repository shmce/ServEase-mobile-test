import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from './error-handling';

export type CustomerProfile = {
  fullName: string;
  mobileNumber: string;
  referralCode: string;
};

export type CustomerAddress = {
  label: 'Home' | 'Work' | 'Other';
  streetAddress: string;
  barangay: string;
  province: string;
  city: string;
  postalCode: string;
  locationNote: string;
  isDefault: boolean;
};

type CustomerAccount = {
  email: string;
  password: string;
  signupName: string;
  signupPhone: string;
  profile: CustomerProfile | null;
  address: CustomerAddress | null;
};

type CustomerSessionState = {
  currentCustomerEmail: string | null;
  pendingOnboardingEmail: string | null;
  customers: Record<string, CustomerAccount>;
};

const listeners = new Set<() => void>();

let state: CustomerSessionState = {
  currentCustomerEmail: null,
  pendingOnboardingEmail: null,
  customers: {
    'karen.santos@email.com': {
      email: 'karen.santos@email.com',
      password: 'Password123',
      signupName: 'Karen Santos',
      signupPhone: '9171234567',
      profile: {
        fullName: 'Karen Santos',
        mobileNumber: '9171234567',
        referralCode: '',
      },
      address: {
        label: 'Home',
        streetAddress: '123 Bonifacio Street, Unit 5',
        barangay: 'Bel-Air',
        province: 'Metro Manila',
        city: 'Makati City',
        postalCode: '1209',
        locationNote: 'Pinned near the main entrance',
        isDefault: true,
      },
    },
  },
};

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: CustomerSessionState) {
  state = nextState;
  emitChange();
}

function getSnapshot() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getActiveEmail() {
  return state.pendingOnboardingEmail ?? state.currentCustomerEmail;
}

async function persistCustomerToDatabase(userId: string, email: string, customer: CustomerAccount) {
  const fullName = customer.profile?.fullName || customer.signupName || email.split('@')[0] || 'Customer';
  const contactNumber = customer.profile?.mobileNumber || customer.signupPhone || '';
  const addressText = customer.address
    ? [
        customer.address.streetAddress,
        customer.address.barangay,
        customer.address.city,
        customer.address.province,
        customer.address.postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  try {
    await supabase.from('users').upsert({
      id: userId,
      email,
      full_name: fullName,
      contact_number: contactNumber,
      role: 'customer',
    });
  } catch {}

  if (addressText) {
    try {
      await supabase.from('customer_profiles').upsert({
        user_id: userId,
        address: addressText,
      });
    } catch {}
  }
}

export function useCustomerSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { user } = useAuth();

  const currentCustomer = user?.email
    ? snapshot.customers[user.email.toLowerCase()] ?? null
    : null;
    
  const pendingCustomer = snapshot.pendingOnboardingEmail
    ? snapshot.customers[snapshot.pendingOnboardingEmail] ?? null
    : null;

  return {
    currentCustomer,
    pendingCustomer,
    isLoggedIn: !!user,
    isInSignupOnboarding: Boolean(pendingCustomer),
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

  // 1. Send to Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: 'customer',
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        referral_code: input.referralCode.trim(),
      }
    }
  });
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to create customer account.'));
  }

  // 2. Fallback to mock state to prevent UI breakage during transition
  const nextCustomer: CustomerAccount = {
    email,
    password: input.password,
    signupName: input.fullName.trim(),
    signupPhone: input.phone.trim(),
    profile: {
      fullName: input.fullName.trim(),
      mobileNumber: input.phone.trim(),
      referralCode: input.referralCode.trim(),
    },
    address: null,
  };

  setState({
    ...state,
    pendingOnboardingEmail: email,
    customers: {
      ...state.customers,
      [email]: nextCustomer,
    },
  });

  if (data.user?.id) {
    await persistCustomerToDatabase(data.user.id, email, nextCustomer);
  }
}

export function savePendingCustomerAddress(address: CustomerAddress) {
  const activeEmail = getActiveEmail();
  if (!activeEmail) return;

  const currentCustomer = state.customers[activeEmail];
  if (!currentCustomer) return;

  setState({
    ...state,
    customers: {
      ...state.customers,
      [activeEmail]: {
        ...currentCustomer,
        address,
      },
    },
  });
}

export function finishSignupOnboarding() {
  if (!state.pendingOnboardingEmail) return;

  setState({
    ...state,
    pendingOnboardingEmail: null,
  });
}

export async function loginCustomer(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Supabase Auth Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: password.trim(),
  });
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to log in.'));
  }

  // 2. Fallback to mock state
  let customer = state.customers[normalizedEmail];

  if (!customer) {
    customer = {
      email: normalizedEmail,
      password: password.trim(),
      signupName: normalizedEmail.split('@')[0] || 'Customer',
      signupPhone: '',
      profile: {
        fullName: normalizedEmail.split('@')[0] || 'Customer',
        mobileNumber: '',
        referralCode: '',
      },
      address: null,
    };

    setState({
      ...state,
      currentCustomerEmail: normalizedEmail,
      pendingOnboardingEmail: null,
      customers: {
        ...state.customers,
        [normalizedEmail]: customer,
      },
    });

    if (data.user?.id) {
      await persistCustomerToDatabase(data.user.id, normalizedEmail, customer);
    }

    return { ok: true as const };
  }

  setState({
    ...state,
    currentCustomerEmail: normalizedEmail,
    pendingOnboardingEmail: null,
  });

  if (data.user?.id) {
    await persistCustomerToDatabase(data.user.id, normalizedEmail, customer);
  }

  return { ok: true as const };
}

export async function logoutCustomer() {
  await supabase.auth.signOut();
  setState({
    ...state,
    currentCustomerEmail: null,
  });
}
