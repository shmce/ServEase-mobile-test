import React, { createContext, useEffect, useSyncExternalStore, useState } from 'react';
import * as Linking from 'expo-linking';
import { parseSupabaseAuthCallback } from '../lib/auth-reset';
import {
  AppAuthSession,
  AppAuthUser,
  getAuthSnapshot,
  loadAuthSnapshot,
  persistAuthSession,
  persistPasswordResetContext,
  subscribeAuthSnapshot,
} from '../lib/auth-session';
import { fetchCurrentUser, refreshSession } from '../services/authService';

type AuthContextType = {
  session: AppAuthSession | null;
  user: AppAuthUser | null;
  isLoading: boolean;
  passwordResetPending: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  passwordResetPending: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authSnapshot = useSyncExternalStore(
    subscribeAuthSnapshot,
    getAuthSnapshot,
    getAuthSnapshot,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const snapshot = await loadAuthSnapshot();
      const session = snapshot.session;

      if (!session?.refresh_token) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        await refreshSession(session.refresh_token);
        const me = await fetchCurrentUser();
        await persistAuthSession({
          ...getAuthSnapshot().session!,
          user: me.user,
          role: me.user.role,
        });
      } catch {
        await persistAuthSession(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const handleAuthUrl = async (url: string | null) => {
      if (!url) return;

      const { accessToken, refreshToken, code } = parseSupabaseAuthCallback(url);

      try {
        if (code || accessToken || refreshToken) {
          await persistPasswordResetContext({
            accessToken,
            refreshToken,
            code,
            tokenHash: parseSupabaseAuthCallback(url).tokenHash,
            type: parseSupabaseAuthCallback(url).type,
          });
        }
      } catch {
        // Keep the stored password reset context as the source of truth.
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (active) {
        void handleAuthUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: authSnapshot.session,
        user: authSnapshot.session?.user ?? null,
        isLoading,
        passwordResetPending: Boolean(authSnapshot.passwordResetContext),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
