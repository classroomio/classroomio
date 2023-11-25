import { fetchCourse } from '$lib/utils/services/courses';
import { supabase, getSupabase } from '$lib/utils/functions/supabase';

if (!supabase) {
  getSupabase();
}

export const load = async ({ params = { slug: '' } }) => {
  const { data } = await fetchCourse(undefined, params.slug);

  return {
    slug: params.slug,
    course: data
  };
};
