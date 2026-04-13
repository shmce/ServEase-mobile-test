import { api } from '@/lib/apiClient';
import {
  AppAuthSession,
  PasswordResetContext,
  persistAuthSession,
  persistPasswordResetContext,
} from '@/lib/auth-session';

type CustomerSignupInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  referralCode: string;
};

type LoginResponse = AppAuthSession;
type MeResponse = { user: AppAuthSession['user'] };
type SessionEnvelope = {
  session: AppAuthSession;
};

async function applySession(session: AppAuthSession) {
  await persistAuthSession(session);
  return session;
}

export async function registerCustomer(input: CustomerSignupInput) {
  const response = await api.post<SessionEnvelope>('/auth/register/customer', {
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    contact_number: input.phone.trim(),
    role: 'customer',
  });

  return applySession(response.session);
}

export async function loginUser(identifier: string, password: string) {
  const session = await api.post<LoginResponse>('/auth/login', {
    identifier: identifier.trim().toLowerCase(),
    password: password.trim(),
  });

  return applySession(session);
}

export async function refreshSession(refreshToken: string) {
  const session = await api.post<AppAuthSession>('/auth/refresh', {
    refresh_token: refreshToken,
  });

  return applySession(session);
}

export async function fetchCurrentUser() {
  return api.get<MeResponse>('/auth/me');
}

export async function logoutUser() {
  try {
    await api.post<{ ok: boolean }>('/auth/logout');
  } catch {
    // Local session cleanup is the source of truth for the mobile app.
  } finally {
    await persistAuthSession(null);
  }
}

export async function requestPasswordReset(email: string, redirectUrl: string) {
  await api.post<{ message: string }>('/auth/forgot-password', {
    email: email.trim().toLowerCase(),
    redirect_to: redirectUrl,
  });
}

export async function resetPassword(password: string, context: PasswordResetContext | null) {
  await api.post<{ message: string }>('/auth/reset-password', {
    password: password.trim(),
    access_token: context?.accessToken,
    refresh_token: context?.refreshToken,
    code: context?.code,
    token_hash: context?.tokenHash,
    type: context?.type,
  });

  await persistPasswordResetContext(null);
  await persistAuthSession(null);
}
