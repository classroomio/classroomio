import { getSupabase } from '$lib/utils/functions/supabase';
// import { getServerSupabase } from '$lib/utils/functions/supabase.server';
const supabase = getSupabase();
export const load = async ({ params = { slug: '' } }) => {
  const { data } = await supabase
    .from('onboarding_setup')
    .select('*')
    .order('id', { ascending: true });

  return {
    orgSiteName: params.slug,
    setup: data
  };
};
