import { redirect } from '@sveltejs/kit';
import { getCurrentOrg } from '$lib/utils/services/org';
import { getSupabase, supabase } from '$lib/utils/functions/supabase';
import { getProfile } from '$lib/utils/functions/user';

if (!supabase) {
  getSupabase();
}

// we need to know if the email exists or not.
// with this we can only ask the user to accept
export const load = async ({ params = { hash: '' } }) => {
  try {
    const hashData = atob(decodeURIComponent(params.hash));
    console.log('hashData', hashData);

    const { orgId, email, orgSiteName } = JSON.parse(hashData);

    const _currentOrg = await getCurrentOrg(orgSiteName, true);

    const profile = await getProfile(email);
    console.log('profile data', profile);

    return {
      orgId,
      email,
      currentOrg: _currentOrg,
      profile
    };
  } catch (error) {
    console.error('Error decoding invite params.hash', error);
    throw redirect(307, '/404');
  }
};
