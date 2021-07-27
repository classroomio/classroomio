import { createClient } from '@supabase/supabase-js';

import config from '../../config';

export const supabase = createClient(
  config.supabaseConfig.url,
  config.supabaseConfig.anonKey
);
