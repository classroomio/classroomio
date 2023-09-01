import { redirect } from '@sveltejs/kit';
import { getCurrentOrg } from '$lib/utils/services/org';
import { getSupabase } from '$lib/utils/functions/supabase';

export const load = async ({ params = { hash: '' } }) => {
  try {
    const hashData = atob(decodeURIComponent(params.hash));
    console.log('hashData', hashData);

    const { orgId, email, orgSiteName } = JSON.parse(hashData);

    getSupabase();
    const _currentOrg = await getCurrentOrg(orgSiteName, true);

    return {
      orgId,
      email,
      currentOrg: _currentOrg
    };
  } catch (error) {
    console.error('Error decoding invite params.hash', error);
    throw redirect(301, '/404');
  }
};
