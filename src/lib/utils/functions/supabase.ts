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
  console.log('supabase config', config);

  supabase = createClient(config.supabaseConfig.url, config.supabaseConfig.anonKey);

  return supabase;
};
