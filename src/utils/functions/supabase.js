import { createClient } from '@supabase/supabase-js';

export let supabase;

export const getSupabase = (config) => {
  if (supabase) return supabase;

  if (!config && process && process.env) {
    config = {
      isProd: process.env.NODE_ENV === 'development',
      supabaseConfig: {
        url: process.env.SVELTE_APP_SUPABASE_URL,
        anonKey: process.env.SVELTE_APP_SUPABASE_ANON_KEY,
      },
    };
  }

  supabase = createClient(
    config.supabaseConfig.url,
    config.supabaseConfig.anonKey
  );

  return supabase;
};
