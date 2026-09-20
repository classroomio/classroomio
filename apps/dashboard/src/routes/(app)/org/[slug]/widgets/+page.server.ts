import type { GetArchivedWidgetsSuccess, GetWidgetsSuccess } from '$features/widget/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

export const load = async ({ parent, cookies, params }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      initialWidgets: [],
      initialArchivedWidgets: []
    };
  }

  const apiHeaders = getApiHeaders(cookies, orgId);

  const [activeResult, archivedResult] = await Promise.all([
    safeServerApi<GetWidgetsSuccess>(() => classroomio.organization.widgets.$get({}, apiHeaders)),
    safeServerApi<GetArchivedWidgetsSuccess>(() => classroomio.organization.widgets.archived.$get({}, apiHeaders))
  ]);

  if (
    (!activeResult.ok && (activeResult.status === 401 || activeResult.status === 403)) ||
    (!archivedResult.ok && (archivedResult.status === 401 || archivedResult.status === 403))
  ) {
    throw redirect(302, `/org/${params.slug}`);
  }

  const initialWidgets = activeResult.ok ? activeResult.body.data : [];
  const initialArchivedWidgets = archivedResult.ok ? archivedResult.body.data : [];

  return {
    initialWidgets,
    initialArchivedWidgets
  };
};
