import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to provide clear guidance if Supabase is not yet configured
export function getSupabaseStatus(): { configured: boolean; message: string } {
  if (isSupabaseConfigured) {
    return {
      configured: true,
      message: 'Connected to live Supabase backend instance.'
    };
  }
  return {
    configured: false,
    message: 'Running in self-contained interactive Demo/Client storage mode. Supabase credentials can be added to .env.local for remote cloud sync.'
  };
}
