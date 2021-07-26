import { createClient } from '@supabase/supabase-js';

import getConfig from '../../config';
const config = getConfig();

export const supabase = createClient(
  config.supabaseConfig.url,
  config.supabaseConfig.anonKey
);
