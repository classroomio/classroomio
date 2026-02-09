import { OrgApiServer } from '$features/org/api/org.server';
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params = { hash: '' } }) => {
  try {
    const token = decodeURIComponent(params.hash);
    const response = await classroomio.invite.student[':token'].preview.$get(
      {
        param: { token }
      },
      getApiKeyHeaders()
    );
    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Invalid invite payload');
    }

    const currentOrg = result.data.organization.siteName
      ? await OrgApiServer.getOrgBySiteName(result.data.organization.siteName)
      : null;

    return {
      token,
      invite: result.data,
      currentOrg
    };
  } catch (error) {
    console.error('Error decoding course invite params.hash', error);
    redirect(307, '/404');
  }
};
