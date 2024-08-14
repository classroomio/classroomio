import { supabase } from '$lib/utils/functions/supabase';
import type { Pathway } from '$lib/utils/types';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export function addPathwayGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}


const SLUG_QUERY = `
  id,
  title,
  description,
  overview,
  logo,
  is_published,
  slug,
  cost,
  currency,
  metadata,
  certificate_theme,
  courses:course(
    id, title,
  )
`;

const ID_QUERY = `
  id,
  title,
  description,
  created_at,
  updated_at,
  group_id,
  is_template,
  logo,
  slug,
  metadata,
  settings,
  cost,
  currency,
  banner_image,
  is_published,
  status,
  certificate_theme,
  is_certificate_downloadable
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
    // return this.redirect(307, '/courses');
    return { data, error };
  }

  return {
    data,
    error
  };
}