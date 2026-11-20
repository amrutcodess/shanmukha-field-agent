import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const AGENT_EMAIL_DOMAIN = 'agents.shanmukhaagritech.app';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const formatAgentEmail = (username: string): string => {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@')) return clean;
  return `${clean}@${AGENT_EMAIL_DOMAIN}`;
};

export const extractUsername = (email: string, role?: string): string => {
  if (email.endsWith(`@${AGENT_EMAIL_DOMAIN}`)) {
    return email.split('@')[0];
  }
  return email;
};
