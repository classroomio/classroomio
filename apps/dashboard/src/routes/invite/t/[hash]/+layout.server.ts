import { orgApi } from '$features/org/api/org.svelte';
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params = { hash: '' } }) => {
  try {
    const token = decodeURIComponent(params.hash);
    const response = await classroomio.invite.organization[':token'].preview.$get(
      {
        param: { token }
      },
      getApiKeyHeaders()
    );
    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Invalid organization invite payload');
    }

    const apiKeyHeaders = getApiKeyHeaders();
    const currentOrg = result.data.organization.siteName
      ? await orgApi.getOrgBySiteName(result.data.organization.siteName, false, apiKeyHeaders)
      : null;

    return {
      token,
      invite: result.data,
      currentOrg
    };
  } catch (error) {
    console.error('Error decoding organization invite params.hash', error);
    redirect(307, '/404');
  }
};
