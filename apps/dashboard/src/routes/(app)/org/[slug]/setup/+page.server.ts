import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetOrganizationSetupRequest = typeof classroomio.organization.setup.$get;
type GetOrganizationSetupSuccess = Extract<InferResponseType<GetOrganizationSetupRequest>, { success: true }>;

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug || '';

  const result = await safeServerApi<GetOrganizationSetupSuccess>(() =>
    classroomio.organization.setup.$get({ query: { siteName } }, getApiHeaders(cookies, orgId))
  );
  const setupProgress = result.ok ? result.body.data : null;

  return {
    orgSiteName: siteName,
    setupProgress
  };
};
