export type DataMode = 'local' | 'supabase';

// Data sync mode: 'local' uses localStorage + cross-tab storage events
// 'supabase' uses live Supabase database with Realtime subscriptions
export const DATA_MODE: DataMode = 
  ((import.meta.env.VITE_DATA_MODE as string)?.toLowerCase() === 'supabase') 
    ? 'supabase' 
    : 'local';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
