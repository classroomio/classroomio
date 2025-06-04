import type { Pathway, PathwayCourse } from '$lib/utils/types';

import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '$lib/utils/functions/supabase';

export function addPathwayGroupMember(member) {
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
      created_at,
        lesson (
          lesson_completion(id, profile_id, is_complete)
      )
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
  is_certificate_downloadable,
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
    is_unlocked,
    course (
      id,
      title,
      logo,
      description,
      banner_image,
      created_at,
      is_published,
      lesson (
        lesson_completion(id, profile_id, is_complete)
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

export async function updatePathway(
  pathwayId: Pathway['id'],
  avatar: string | undefined,
  pathway: Partial<Pathway>
) {
  if (avatar && pathwayId) {
    const filename = `pathway/${pathwayId + Date.now()}.webp`;

    const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
      cacheControl: '3600',
      upsert: false
    });

    if (data) {
      const { data: response } = supabase.storage.from('avatars').getPublicUrl(filename);

      if (!response.publicUrl) return;

      pathway.logo = response.publicUrl;
    }
  }

  await supabase.from('pathway').update(pathway).match({ id: pathwayId });

  return pathway.logo;
}

export async function deletePathway(pathwayId: Pathway['id']) {
  return await supabase.from('pathway').update({ status: 'DELETED' }).match({ id: pathwayId });
}

export async function deletePathwayCourse(courseId: PathwayCourse['course_id']) {
  return supabase.from('pathway_course').delete().match({ course_id: courseId });
}

export function addPathwayCourse(
  pathwayId: Pathway['id'],
  courseId: PathwayCourse['course_id'],
  order: PathwayCourse['order']
) {
  return supabase
    .from('pathway_course')
    .insert([
      {
        pathway_id: pathwayId,
        course_id: courseId,
        order: order
      }
    ])
    .select();
}

export function updatePathwayCourses(id: PathwayCourse['id'], order: PathwayCourse['order']) {
  return supabase.from('pathway_course').update({ order: order }).match({ id: id });
}

export async function uploadAvatar(pathwayId: string, avatar: string) {
  const filename = `pathway/${pathwayId + Date.now()}.webp`;
  let logo;

  const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
    cacheControl: '3600',
    upsert: false
  });

  if (data) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(filename);

    if (!data.publicUrl) return;

    logo = data.publicUrl;
  }

  return logo;
}
