import { redirect } from '@sveltejs/kit';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import { getCurrentOrg } from '$lib/utils/services/org';

if (!supabase) {
  getSupabase();
}

export const load = async ({ params = { hash: '' } }) => {
  try {
    const courseHashData = atob(decodeURIComponent(params.hash));
    console.log('courseHashData', courseHashData);

    const { groupId, name, description, orgSiteName } = JSON.parse(courseHashData);

    if (!groupId || !name || !description || !orgSiteName) {
      throw 'Validation failed';
    }
    const currentOrg = await getCurrentOrg(orgSiteName, true);

    return {
      groupId,
      name,
      description,
      currentOrg
    };
  } catch (error) {
    console.error('Error decoding course invite params.hash', error);
    throw redirect(301, '/404');
  }
};
