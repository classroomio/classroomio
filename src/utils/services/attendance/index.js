import { supabase } from '../../functions/supabase';

export async function takeAttendance(update) {
  return supabase.from('group_attendance').upsert(update);
}
