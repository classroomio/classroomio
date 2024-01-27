const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!;
const PUBLIC_SUPABASE_BUCKET_URL = process.env.PUBLIC_SUPABASE_BUCKET_URL!;
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigType } from 'types/config';

export let supabase: SupabaseClient;

export const getSupabase = (config?: ConfigType) => {
  if (supabase) return supabase;
  config = {
    supabaseConfig: {
      bucketPath: PUBLIC_SUPABASE_BUCKET_URL + '/storage/v1/object/sign/',
      url: PUBLIC_SUPABASE_URL,
      anonKey: PUBLIC_SUPABASE_ANON_KEY
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
