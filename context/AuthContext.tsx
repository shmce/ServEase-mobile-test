import React, { createContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { parseSupabaseAuthCallback } from '../lib/auth-reset';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    const handleAuthUrl = async (url: string | null) => {
      if (!url) return;

      const { accessToken, refreshToken, code } = parseSupabaseAuthCallback(url);

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          return;
        }

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch {
        // Keep auth listener as the source of truth for visible session state.
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
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
