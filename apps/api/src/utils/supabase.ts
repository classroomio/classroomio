import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { env } from '$src/config/env';

const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE } = env;

export let supabase: SupabaseClient | null = null;

interface SupabaseConfig {
  supabaseConfig: {
    url: string;
    anonKey: string;
  };
}

export function getSupabase(config?: SupabaseConfig): SupabaseClient {
  if (supabase) return supabase;

  try {
    // Use service role key to bypass RLS policies
    supabase = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false }
    });
  } catch (error) {
    console.error('Error starting supabase', error);
    throw error;
  }

  return supabase;
}

