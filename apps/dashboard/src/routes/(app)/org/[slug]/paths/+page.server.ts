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
    classroomio['learning-path'].$get(
      { query: { organizationId: orgId, page: String(1), limit: String(100) } },
      getApiHeaders(cookies, orgId)
    )
  );

  const body = result.ok ? result.body : null;
  const paths = body && Array.isArray(body.data) ? body.data : [];

  return {
    paths: result.ok ? paths : null,
    pathsPagination: body?.pagination ?? null,
    loadError: result.ok ? null : result.message || 'Failed to load learning paths'
  };
};
