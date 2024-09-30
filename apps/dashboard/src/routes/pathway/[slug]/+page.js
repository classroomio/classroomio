import { supabase, getSupabase } from '$lib/utils/functions/supabase';
import { fetchPathway } from '$lib/utils/services/pathways';

if (!supabase) {
  getSupabase();
}

export const load = async ({ params = { slug: '' } }) => {
  const { data } = await fetchPathway(undefined, params.slug);

  return {
    slug: params.slug,
    pathway: data
  };
};
