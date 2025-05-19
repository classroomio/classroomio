import { config } from '$lib/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient;

export const getSupabase = () => {
  if (supabase) return supabase;

  supabase = createClient(config.supabaseConfig.url, config.supabaseConfig.anonKey);

  return supabase;
};

export const isSupabaseTokenInLocalStorage = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null) continue; // Skip if null (shouldn't happen)
    if (/sb-[\w-]+-auth-token/.test(key)) {
      return true;
    }
  }

  return false;
};

export const getAccessToken = async () => {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token || '';
};
