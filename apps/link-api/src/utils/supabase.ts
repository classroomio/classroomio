import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../database.types';

type SupabaseConfig = {
  url: string;
  key: string;
};

export let supabase: SupabaseClient;
// Initialize Supabase client
export function supabaseInit({ url, key }: SupabaseConfig): SupabaseClient {
  if (supabase) return supabase;
  return createClient<Database>(url, key);
}
