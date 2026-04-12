import { getOrgBySiteName } from '$features/org/api/org.server';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type PreviewOrganizationInviteRequest = (typeof classroomio.invite.organization)[':token']['preview']['$get'];
type PreviewOrganizationInviteSuccess = Extract<InferResponseType<PreviewOrganizationInviteRequest>, { success: true }>;

export const load = async ({ params = { hash: '' } }) => {
  try {
    const token = decodeURIComponent(params.hash);
    const result = await safeServerApi<PreviewOrganizationInviteSuccess>(() =>
      classroomio.invite.organization[':token'].preview.$get(
        {
          param: { token }
        },
        getApiKeyHeaders()
      )
    );

    if (!result.ok || !result.body.data) {
      throw new Error('Invalid organization invite payload');
    }

    const apiKeyHeaders = getApiKeyHeaders();
    const currentOrg = result.body.data.organization.siteName
      ? await getOrgBySiteName(result.body.data.organization.siteName, apiKeyHeaders)
      : null;

    return {
      token,
      invite: result.body.data,
      currentOrg
    };
  } catch (e) {
    console.error('Error decoding organization invite params.hash', e);
    throw error(404, 'Not found');
  }
};
