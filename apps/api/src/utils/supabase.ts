import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { env } from '$src/config/env';

const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } = env;

export let supabase: SupabaseClient | null = null;

interface SupabaseConfig {
  supabaseConfig: {
    url: string;
    anonKey: string;
  };
}

export function getSupabase(config?: SupabaseConfig): SupabaseClient {
  if (supabase) return supabase;

  const finalConfig = config ?? {
    supabaseConfig: {
      url: PUBLIC_SUPABASE_URL,
      anonKey: PUBLIC_SUPABASE_ANON_KEY
    }
  };

  try {
    supabase = createClient(finalConfig.supabaseConfig.url, finalConfig.supabaseConfig.anonKey, {
      auth: { persistSession: false }
    });
  } catch (error) {
    console.error('Error starting supabase', error);
    throw error;
  }

  return supabase;
}
