import { useSyncExternalStore } from 'react';

export type CustomerProfile = {
  fullName: string;
  mobileNumber: string;
  referralCode: string;
  dob: string;
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
        dob: '01/01/1990',
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

export function useCustomerSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const currentCustomer = snapshot.currentCustomerEmail
    ? snapshot.customers[snapshot.currentCustomerEmail] ?? null
    : null;
  const pendingCustomer = snapshot.pendingOnboardingEmail
    ? snapshot.customers[snapshot.pendingOnboardingEmail] ?? null
    : null;

  return {
    currentCustomer,
    pendingCustomer,
    isLoggedIn: Boolean(currentCustomer),
    isInSignupOnboarding: Boolean(pendingCustomer),
  };
}

export function registerCustomerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dob: string;
  referralCode: string;
}) {
  const email = input.email.trim().toLowerCase();

  setState({
    ...state,
    pendingOnboardingEmail: email,
    customers: {
      ...state.customers,
      [email]: {
        email,
        password: input.password,
        signupName: input.fullName.trim(),
        signupPhone: input.phone.trim(),
        profile: {
          fullName: input.fullName.trim(),
          mobileNumber: input.phone.trim(),
          referralCode: input.referralCode.trim(),
          dob: input.dob.trim(),
        },
        address: null,
      },
    },
  });
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

export function loginCustomer(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const customer = state.customers[normalizedEmail];

  if (!customer) {
    setState({
      ...state,
      currentCustomerEmail: normalizedEmail,
      pendingOnboardingEmail: null,
      customers: {
        ...state.customers,
        [normalizedEmail]: {
          email: normalizedEmail,
          password: password.trim(),
          signupName: normalizedEmail.split('@')[0] || 'Customer',
          signupPhone: '',
          profile: {
            fullName: normalizedEmail.split('@')[0] || 'Customer',
            mobileNumber: '',
            referralCode: '',
            dob: '',
          },
          address: null,
        },
      },
    });

    return { ok: true as const };
  }

  setState({
    ...state,
    currentCustomerEmail: normalizedEmail,
    pendingOnboardingEmail: null,
  });

  return { ok: true as const };
}

export function logoutCustomer() {
  setState({
    ...state,
    currentCustomerEmail: null,
  });
}
