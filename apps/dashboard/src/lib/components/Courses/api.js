import { supabase } from '$lib/utils/functions/supabase';
import { get } from 'svelte/store';
import { isOrgAdmin } from '$lib/utils/store/org';

export async function fetchCourses(profileId, orgId) {
  if (!orgId || !profileId) return;

  const match = {};
  // Filter by profile_id if role isn't admin within organization
  if (!get(isOrgAdmin)) {
    match.member_profile_id = profileId;
  }

  // Gets courses for a particular organisation where the current logged in user is a groupmember
  const { data: allCourses } = await supabase
    .rpc('get_courses', {
      org_id_arg: orgId,
      profile_id_arg: profileId
    })
    .match(match);

  console.log(`allCourses`, allCourses);
  if (!Array.isArray(allCourses)) {
    return {
      allCourses: []
    };
  }

  return { allCourses };
}
