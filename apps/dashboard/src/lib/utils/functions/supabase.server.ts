import { env } from '$env/dynamic/private';
import { config } from '$lib/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient;

/**
 * Should only be called on server files
 *
 * @returns supabase
 */
export const getServerSupabase = () => {
  if (supabase) return supabase;

  supabase = createClient(config.supabaseConfig.url, env.PRIVATE_SUPABASE_SERVICE_ROLE || 'some-key-here', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return supabase;
};
