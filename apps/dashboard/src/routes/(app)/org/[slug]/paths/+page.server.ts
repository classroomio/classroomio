import { safeServerApi } from '$lib/utils/services/api/server';
import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import {
  parsePathListFilters,
  PATH_LIST_PAGE_SIZE,
  toPathListApiQuery
} from '$features/learning-path/utils/path-list-filters';

type ListPathsRequest = (typeof classroomio)['learning-path']['$get'];
type ListPathsSuccess = Extract<InferResponseType<ListPathsRequest>, { success: true }>;

export const load = async ({ parent, params, cookies, locals, url }) => {
  const { orgId } = await parent();
  const filters = parsePathListFilters(url.searchParams);

  if (!orgId || !locals.user?.id) {
    return {
      orgSlug: params.slug,
      orgId,
      paths: [],
      pagination: { page: 1, limit: PATH_LIST_PAGE_SIZE, total: 0, totalPages: 0, hasMore: false },
      filters,
      loadError: null
    };
  }

  const result = await safeServerApi<ListPathsSuccess>(() =>
    classroomio['learning-path'].$get({ query: toPathListApiQuery(orgId, filters, 1) }, getApiHeaders(cookies, orgId))
  );

  const body = result.ok ? result.body : null;
  const paths = body && Array.isArray(body.data) ? body.data : [];
  const serverPagination = body?.pagination;
  const pagination = {
    page: serverPagination?.page ?? 1,
    limit: serverPagination?.limit ?? PATH_LIST_PAGE_SIZE,
    total: serverPagination?.total ?? 0,
    totalPages: serverPagination?.totalPages ?? 0,
    hasMore: (serverPagination?.page ?? 1) < (serverPagination?.totalPages ?? 0)
  };

  return {
    paths: result.ok ? paths : null,
    pagination,
    filters,
    loadError: result.ok ? null : result.message || 'Failed to load learning paths'
  };
};
