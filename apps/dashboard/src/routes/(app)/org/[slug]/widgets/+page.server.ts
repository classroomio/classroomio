import type { GetArchivedWidgetsSuccess, GetWidgetsSuccess, WidgetListPagination } from '$features/widget/utils/types';
import {
  getWidgetListFiltersFromSearchParams,
  toWidgetListRequestQuery,
  withoutStatusFilter
} from '$features/widget/utils/widget-list-filters';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

const EMPTY_PAGINATION: WidgetListPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

export const load = async ({ parent, cookies, params, url }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      initialWidgets: [],
      initialArchivedWidgets: [],
      widgetPagination: EMPTY_PAGINATION,
      archivedWidgetPagination: EMPTY_PAGINATION
    };
  }

  const apiHeaders = getApiHeaders(cookies, orgId);
  const filters = getWidgetListFiltersFromSearchParams(url.searchParams);
  const archivedFilters = withoutStatusFilter(filters);
  const activeQuery = toWidgetListRequestQuery(filters);
  const archivedQuery = toWidgetListRequestQuery(archivedFilters);

  const [activeResult, archivedResult] = await Promise.all([
    safeServerApi<GetWidgetsSuccess>(() => classroomio.organization.widgets.$get({ query: activeQuery }, apiHeaders)),
    safeServerApi<GetArchivedWidgetsSuccess>(() =>
      classroomio.organization.widgets.archived.$get({ query: archivedQuery }, apiHeaders)
    )
  ]);

  if (
    (!activeResult.ok && (activeResult.status === 401 || activeResult.status === 403)) ||
    (!archivedResult.ok && (archivedResult.status === 403 || archivedResult.status === 401))
  ) {
    throw redirect(302, `/org/${params.slug}`);
  }

  const initialWidgets = activeResult.ok ? activeResult.body.data : [];
  const initialArchivedWidgets = archivedResult.ok ? archivedResult.body.data : [];
  const widgetPagination = activeResult.ok ? activeResult.body.pagination : EMPTY_PAGINATION;
  const archivedWidgetPagination = archivedResult.ok ? archivedResult.body.pagination : EMPTY_PAGINATION;

  return {
    initialWidgets,
    initialArchivedWidgets,
    widgetPagination,
    archivedWidgetPagination
  };
};
