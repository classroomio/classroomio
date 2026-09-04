import { getOrgBySiteName } from '$features/org/api/org.server';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type PreviewInviteLinkRequest = (typeof classroomio.invite)['r'][':token']['preview']['$get'];
type PreviewInviteLinkSuccess = Extract<InferResponseType<PreviewInviteLinkRequest>, { success: true }>;

export const load = async ({ params = { token: '' } }) => {
  try {
    const token = decodeURIComponent(params.token);
    const result = await safeServerApi<PreviewInviteLinkSuccess>(() =>
      classroomio.invite.r[':token'].preview.$get({ param: { token } }, getApiKeyHeaders())
    );

    if (!result.ok || !result.body.data) {
      throw new Error('Invalid invite link payload');
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
    console.error('Error loading invite link preview', e);
    throw error(404, 'Not found');
  }
};
