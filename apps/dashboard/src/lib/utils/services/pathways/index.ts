import { supabase } from '$lib/utils/functions/supabase';
import type { Pathway, PathwayCourse, ProfilePathwayProgress } from '$lib/utils/types';
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

export function addPathwayGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}


const SLUG_QUERY = `
  id,
  title,
  description,
  logo,
  is_published,
  slug,
  cost,
  currency,
  landingpage,
  certificate_theme,
  pathway_course (
    id,
    course_id,
    pathway_id,
    course (
      id,
      title,
      description,
      created_at
    )
  )
`;

const ID_QUERY = `
  id,
  title,
  description,
  logo,
  is_published,
  slug,
  cost,
  currency,
  landingpage,
  certificate_theme,
    group(*,
    members:groupmember(*,
      profile(*)
    )
  ),
  pathway_course (
    id,
    order,
    course_id,
    pathway_id,
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
  )
`;

export async function fetchPathway(pathwayId?: Pathway['id'], slug?: Pathway['slug']) {
  const match: { slug?: string; id?: string } = {};

  if (slug) {
    match.slug = slug;
  } else {
    match.id = pathwayId;
  }

  const response: PostgrestSingleResponse<Pathway | null> = await supabase
    .from('pathway')
    .select(slug ? SLUG_QUERY : ID_QUERY)
    .match(match)
    .single();

  const { data, error } = response;

  console.log(`error`, error);
  console.log(`data`, data);
  if (!data || error) {
    console.log(`data`, data);
    console.log(`fetchPathway => error`, error);
    return { data, error };
  }

  return {
    data,
    error
  };
}

export function addPathwayCourse(pathwayId: Pathway['id'], courseId: PathwayCourse['course_id']) {
  return supabase.from('pathway_course').insert([
    {
      pathway_id: pathwayId,
      course_id: courseId,
    }
  ]).select();
}

export function updatePathwayCourses(id: any, pathwayId: Pathway['id'], courseId: PathwayCourse['course_id'], order: PathwayCourse['order']) {
  return supabase
    .from('pathway_course')
    .update({ order: order })
    .match({ id: id, pathway_id: pathwayId, course_id: courseId });
}

export async function fetchProfilePathwayProgress(
  pathwayId,
  profileId
): Promise<{
  data: ProfilePathwayProgress[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .rpc('get_pathway_progress', {
      pathway_id_arg: pathwayId,
      profile_id_arg: profileId
    })
    .returns<ProfilePathwayProgress[]>();

  return { data, error };
}