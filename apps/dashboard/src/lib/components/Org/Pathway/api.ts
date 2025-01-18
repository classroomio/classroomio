import { supabase } from '$lib/utils/functions/supabase';
import { isOrgAdmin } from '$lib/utils/store/org';
import type { Pathway } from '$lib/utils/types';
import { get } from 'svelte/store';

export async function fetchPathwayCourse(pathwayId: string, eq: string) {
  try {
    const { data, error } = await supabase
      .from('pathway_course')
      .select(
        `
          id, pathway_id, order, course_id, is_unlocked,
          course (
            id, title, logo, description, banner_image, is_published, created_at,
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
      .eq(`${eq}`, pathwayId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching pathway course:', error);
    throw error;
  }
}

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
  const pathwayIds = allPathways.map((pathway: Pathway) => pathway.id);

  if (!Array.isArray(pathwayIds)) {
    console.error('Error fetching courses: pathwayIds is not an array');
    return {
      allPathways
    };
  }

  const allCourses = await Promise.all(
    pathwayIds
      .filter((id) => id !== undefined)
      .map((id) => fetchPathwayCourse(id as string, 'pathway_id'))
  );

  if (!Array.isArray(allCourses)) {
    console.error('Error fetching courses:');
    return {
      allPathways
    };
  }

  // Step 3: Attach courses to their respective pathways and rename pathway_course to courses
  const pathwaysWithCourses = allPathways.map((pathway: any) => {
    const courses = allCourses.filter((course: any) => course.pathway_id === pathway.id);
    return {
      ...pathway,
      pathway_course: courses,
      type: 'Pathway'
    };
  });

  return { allPathways: pathwaysWithCourses };
}
