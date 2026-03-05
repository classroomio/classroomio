import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _db: SupabaseClient | null = null;

export function initDb(supabaseUrl: string, supabaseServiceRoleKey: string): void {
  _db = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

export function getDb(): SupabaseClient {
  if (!_db) {
    throw new Error(
      '@cio/agent: database not initialised — call createAgentRouter() before handling requests'
    );
  }
  return _db;
}
