import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ConfigType } from '../types';

export let supabase: SupabaseClient;

export const getSupabase = (config?: ConfigType) => {
  if (supabase) return supabase;

  config = {
    supabaseConfig: {
      bucketPath: 'https://koxqonvbkeakwvmdegcf.supabase.in/storage/v1/object/sign/',
      url: PUBLIC_SUPABASE_URL || '',
      anonKey: PUBLIC_SUPABASE_ANON_KEY || ''
    }
  };

  supabase = createClient(config.supabaseConfig.url, config.supabaseConfig.anonKey);

  return supabase;
};
