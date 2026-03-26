import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '../context/AuthContext';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading } = useAuth();
  const [dbRole, setDbRole] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    async function loadDbRole() {
      if (!user?.id) {
        setDbRole('');
        return;
      }

      const roleRaw =
        user.user_metadata?.role ??
        user.app_metadata?.role ??
        user.user_metadata?.user_type ??
        user.app_metadata?.user_type ??
        '';
      if (String(roleRaw).trim().length > 0) {
        setDbRole('');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (mounted) {
        setDbRole(String(data?.role || '').toLowerCase());
      }
    }

    loadDbRole();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] ?? 'index';
    const isPublicRoute = new Set([
      'index',
      'login',
      'signup',
      'provider-join',
      'customer-login',
      'provider-login',
      'customer-signup',
      'provider-signup',
      'customer-onboarding-address',
      'reset-password',
      'customer-forgot-password',
      'provider-forgot-password',
      'terms',
      'privacy',
    ]).has(firstSegment);

    const roleRaw =
      user?.user_metadata?.role ??
      user?.app_metadata?.role ??
      user?.user_metadata?.user_type ??
      user?.app_metadata?.user_type ??
      dbRole ??
      '';
    const role = String(roleRaw || dbRole).toLowerCase();
    const hasMetadataRole = String(
      user?.user_metadata?.role ??
        user?.app_metadata?.role ??
        user?.user_metadata?.user_type ??
        user?.app_metadata?.user_type ??
        ''
    ).trim().length > 0;
    if (user && !hasMetadataRole && !dbRole) {
      return;
    }
    const isProvider = role.includes('provider');

    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    const allowAuthedPublicRoute =
      firstSegment === 'customer-onboarding-address' || firstSegment === 'reset-password';

    if (user && isPublicRoute && !allowAuthedPublicRoute) {
      router.replace(isProvider ? '/(provider-tabs)' : '/(tabs)');
      return;
    }

    if (user && firstSegment === '(provider-tabs)' && !isProvider) {
      router.replace('/(tabs)');
      return;
    }

    if (user && firstSegment === '(tabs)' && isProvider) {
      router.replace('/(provider-tabs)');
    }
  }, [dbRole, isLoading, router, segments, user]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(provider-tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
