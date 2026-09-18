import { safeServerApi } from '$lib/utils/services/api/server';
import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';

type ListPathsRequest = (typeof classroomio)['learning-path']['$get'];
type ListPathsSuccess = Extract<InferResponseType<ListPathsRequest>, { success: true }>;

export const load = async ({ parent, params, cookies, locals }) => {
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return {
      orgSlug: params.slug,
      orgId,
      paths: [],
      loadError: null
    };
  }

  const result = await safeServerApi<ListPathsSuccess>(() =>
    classroomio['learning-path'].$get({ query: { organizationId: orgId } }, getApiHeaders(cookies, orgId))
  );

  return {
    paths: result.ok ? result.body.data : [],
    loadError: result.ok ? null : result.message || 'Failed to load learning paths'
  };
};
