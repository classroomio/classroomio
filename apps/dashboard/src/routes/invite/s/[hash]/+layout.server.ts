import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import { getCurrentOrg } from '$lib/utils/services/org';
import { redirect } from '@sveltejs/kit';
import isBoolean from 'lodash/isBoolean';

if (!supabase) {
  getSupabase();
}

export const load = async ({ params = { hash: '' } }) => {
  try {
    const courseHashData = atob(decodeURIComponent(params.hash));
    console.log('courseHashData', courseHashData);

    const { id, name, description, isPathway, orgSiteName } = JSON.parse(courseHashData);

    if (!id || !name || !description || !isBoolean(isPathway) || !orgSiteName) {
      throw 'Validation failed';
    }
    const currentOrg = await getCurrentOrg(orgSiteName, true);

    return {
      id,
      name,
      isPathway,
      description,
      currentOrg
    };
  } catch (error) {
    console.error('Error decoding course invite params.hash', error);
    throw redirect(307, '/404');
  }
};
