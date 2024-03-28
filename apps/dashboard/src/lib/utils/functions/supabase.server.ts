import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE } from '$env/static/private';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient;

/**
 * Should only be called on server files
 *
 * @returns supabase
 */
export const getServerSupabase = () => {
  if (supabase) return supabase;

  supabase = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return supabase;
};
