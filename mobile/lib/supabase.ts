import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Storage } from './storage';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://strtoeeidqnsmbszhjhe.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cnRvZWVpZHFuc21ic3poamhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTc2MzksImV4cCI6MjA4OTkzMzYzOX0.nlyLYzTvpw1bUZy8hdK4WDmdsbr86vAcaINAQ8wvPoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
