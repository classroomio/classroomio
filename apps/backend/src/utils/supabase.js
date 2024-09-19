const { createClient } = require('@supabase/supabase-js');

const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } = process.env;

let supabase;

const getSupabase = (config) => {
  if (supabase) return supabase;

  config = {
    supabaseConfig: {
      url: PUBLIC_SUPABASE_URL || '',
      anonKey: PUBLIC_SUPABASE_ANON_KEY || ''
    }
  };

  supabase = createClient(config.supabaseConfig.url, config.supabaseConfig.anonKey, {
    auth: { persistSession: false }
  });

  return supabase;
};

module.exports = {
  getSupabase
};
