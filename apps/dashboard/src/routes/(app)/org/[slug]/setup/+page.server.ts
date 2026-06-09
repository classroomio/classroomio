import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetOrganizationSetupRequest = typeof classroomio.organization.setup.$get;
type GetOrganizationSetupSuccess = Extract<InferResponseType<GetOrganizationSetupRequest>, { success: true }>;

export const load = async ({ params, parent, cookies }) => {
  const loadStart = performance.now();
  const siteName = params.slug || '';

  const parentStart = performance.now();
  const { orgId } = await parent();
  const parentMs = Math.round((performance.now() - parentStart) * 100) / 100;

  const setupApiStart = performance.now();
  const result = await safeServerApi<GetOrganizationSetupSuccess>(() =>
    classroomio.organization.setup.$get({ query: { siteName } }, getApiHeaders(cookies, orgId))
  );
  const setupApiMs = Math.round((performance.now() - setupApiStart) * 100) / 100;

  const setupProgress = result.ok ? result.body.data : null;
  const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;

  console.log(
    `[org/setup/+page.server] load: ${loadMs}ms | siteName=${siteName} parent: ${parentMs}ms organization.setup: ${setupApiMs}ms ok=${result.ok}`
  );

  return {
    orgSiteName: siteName,
    setupProgress
  };
};
