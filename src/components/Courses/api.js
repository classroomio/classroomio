import { supabase } from '../../utils/functions/supabase';

export async function fetchCourses(profileId) {
  if (!profileId) return;

  const { data: allCourses } = await supabase
    .rpc('get_courses')
    .eq('profile_id', profileId);

  console.log(`allCourses`, allCourses);

  return { allCourses };
}
