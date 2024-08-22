// import { supabase } from '$lib/utils/functions/supabase';
// import { get } from 'svelte/store';
// import { isOrgAdmin } from '$lib/utils/store/org';

// export async function fetchPathways(profileId: string | undefined, orgId: string | undefined) {
//   if (!orgId || !profileId) return;

//   const match: {
//     member_profile_id?: string;
//   } = {};
//   // Filter by profile_id if role isn't admin within organization
//   if (!get(isOrgAdmin)) {
//     match.member_profile_id = profileId;
//   }

//   const { data: allPathways } = await supabase
//     .rpc('get_pathways', {
//       org_id_arg: orgId,
//       profile_id_arg: profileId
//     })
//     .match(match);

//   if (!Array.isArray(allPathways)) {
//     return {
//       allPathways: []
//     };
//   }

//   return { allPathways };
// }

import { supabase } from '$lib/utils/functions/supabase';
import { get } from 'svelte/store';
import { isOrgAdmin } from '$lib/utils/store/org';

export async function fetchPathways(profileId: string | undefined, orgId: string | undefined) {
  if (!orgId || !profileId) return;

  const match: {
    member_profile_id?: string;
  } = {};

  // Filter by profile_id if role isn't admin within organization
  if (!get(isOrgAdmin)) {
    match.member_profile_id = profileId;
  }

  // Step 1: Fetch pathways using the RPC function
  const { data: allPathways, error: pathwayError } = await supabase
    .rpc('get_pathways', {
      org_id_arg: orgId,
      profile_id_arg: profileId
    })
    .match(match);

  if (pathwayError || !Array.isArray(allPathways)) {
    console.error('Error fetching pathways:', pathwayError);
    return {
      allPathways: []
    };
  }

  // Step 2: Fetch courses for each pathway
  const pathwayIds = allPathways.map((pathway: any) => pathway.id);

  const { data: allCourses, error: courseError } = await supabase
    .from('pathway_course')
    .select(
      `
      id,
      pathway_id,
      order,
      course_id,
      course (
        id,
        title,
        logo,
        description,
        banner_image,
        created_at,
        lesson (
          is_complete
        ),
        group_id (
          groupmember (
            id
          )
        )
      )
    `
    )
    .in('pathway_id', pathwayIds);

  if (courseError || !Array.isArray(allCourses)) {
    console.error('Error fetching courses:', courseError);
    return {
      allPathways
    };
  }

  // Step 3: Attach courses to their respective pathways and rename pathway_course to courses
  const pathwaysWithCourses = allPathways.map((pathway: any) => {
    const courses = allCourses.filter((course: any) => course.pathway_id === pathway.id);
    return {
      ...pathway,
      pathway_course: courses // Rename pathway_course to courses
    };
  });

  return { allPathways: pathwaysWithCourses };
}
