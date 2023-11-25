import { supabase } from '$lib/utils/functions/supabase';

export async function fetchCourses(profileId, orgId) {
  if (!orgId || !profileId) return;

  // Gets courses for a particular organisation where the current logged in user is a groupmember
  const { data: allCourses } = await supabase
    .rpc('get_courses', {
      org_id_arg: orgId,
      profile_id_arg: profileId
    })
    .eq('profile_id', profileId);

  console.log(`allCourses`, allCourses);
  if (!Array.isArray(allCourses)) {
    return {
      allCourses: []
    };
  }

  return { allCourses };
}
