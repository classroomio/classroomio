import { createClient } from '@supabase/supabase-js';

let _supabase;

export const getSupabase = (config) => {
  if (_supabase) return _supabase;

  if (!config && process && process.env) {
    config = {
      isProd: process.env.NODE_ENV === 'development',
      supabaseConfig: {
        url: process.env.SVELTE_APP_SUPABASE_URL,
        anonKey: process.env.SVELTE_APP_SUPABASE_ANON_KEY,
      },
    };
  }

  _supabase = createClient(
    config.supabaseConfig.url,
    config.supabaseConfig.anonKey
  );

  return _supabase;
};
