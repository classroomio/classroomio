import { config } from './superbase';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient;

/**
 * Should only be called on server files
 *
 * @returns supabase
 */
export const getServerSupabase = () => {
  if (supabase) return supabase;

  supabase = createClient(
    config.supabaseConfig.url,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXBhbHppdGt1aXJ1ZmVvaW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgzNTgzOCwiZXhwIjoyMDY1NDExODM4fQ.SvBt9zTPhFk0rvweHXKu6a7fuDlUGz0dpB3ZotBHr1o',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  return supabase;
};
