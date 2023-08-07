import { supabase } from '$lib/utils/functions/supabase';

export async function takeAttendance(update) {
  return supabase.from('group_attendance').upsert(update).select();
}
