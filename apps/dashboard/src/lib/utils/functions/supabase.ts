import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_BUCKET_URL
} from '$env/static/public';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ConfigType } from '../types';

export let supabase: SupabaseClient;

export const getSupabase = (config?: ConfigType) => {
  if (supabase) return supabase;
  config = {
    supabaseConfig: {
      bucketPath: PUBLIC_SUPABASE_BUCKET_URL + '/storage/v1/object/sign/',
      url: PUBLIC_SUPABASE_URL || '',
      anonKey: PUBLIC_SUPABASE_ANON_KEY || ''
    }
  };

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
