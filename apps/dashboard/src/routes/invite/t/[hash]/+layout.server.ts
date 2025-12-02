import { OrgApiServer } from '$lib/features/org/api/org.server';
import { getProfile } from '$lib/utils/functions/user';
import { redirect } from '@sveltejs/kit';

// we need to know if the email exists or not.
// with this we can only ask the user to accept
export const load = async ({ params = { hash: '' } }) => {
  try {
    const hashData = atob(decodeURIComponent(params.hash));
    console.log('hashData', hashData);

    const { orgId, email, orgSiteName } = JSON.parse(hashData);

    const currentOrg = await OrgApiServer.getOrgBySiteName(orgSiteName);

    const profile = await getProfile(email);
    console.log('profile data', profile);

    return {
      invite: {
        orgId,
        email,
        currentOrg,
        profile
      }
    };
  } catch (error) {
    console.error('Error decoding invite params.hash', error);
    redirect(307, '/404');
  }
};
