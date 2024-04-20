import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { ConfigType } from '$lib/utils/types/config';

export const config: ConfigType = {
  supabaseConfig: {
    url: PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: PUBLIC_SUPABASE_ANON_KEY || 'anon-key'
  }
};
