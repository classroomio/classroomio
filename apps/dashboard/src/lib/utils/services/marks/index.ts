import { supabase } from '$lib/utils/functions/supabase';

export async function fetchMarks(courseId) {
  const { data, error } = await supabase.rpc('get_marks').eq('course_id', courseId);

  return { data, error };
}
