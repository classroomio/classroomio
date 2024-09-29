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

    const { id, name, description, orgSiteName, batchId } = JSON.parse(courseHashData);

    if (!id || !name || !description || !orgSiteName || !batchId) {
      throw 'Validation failed';
    }
    const currentOrg = await getCurrentOrg(orgSiteName, true);

    return {
      id,
      name,
      description,
      currentOrg, batchId
    };
  } catch (error) {
    console.error('Error decoding course invite params.hash', error);
    throw redirect(307, '/404');
  }
};
