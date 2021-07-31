import { getSupabase } from '../../utils/functions/supabase';

export function post(req, res) {
  const supabase = getSupabase();

  supabase.auth.api.setAuthCookie(req, res);
}
