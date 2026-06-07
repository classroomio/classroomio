import { getOrgBySiteName } from '$features/org/api/org.server';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type PreviewLinkInviteRequest = (typeof classroomio.invite)['link'][':token']['preview']['$get'];
type PreviewLinkInviteSuccess = Extract<InferResponseType<PreviewLinkInviteRequest>, { success: true }>;

export const load = async ({ params = { hash: '' } }) => {
  try {
    const token = decodeURIComponent(params.hash);
    const result = await safeServerApi<PreviewLinkInviteSuccess>(() =>
      classroomio.invite.link[':token'].preview.$get({ param: { token } }, getApiKeyHeaders())
    );

    if (!result.ok || !result.body.data) {
      throw new Error('Invalid link invite payload');
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
    console.error('Error decoding link invite params.hash', e);
    throw error(404, 'Not found');
  }
};
