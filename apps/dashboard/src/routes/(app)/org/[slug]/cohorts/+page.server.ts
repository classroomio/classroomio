import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetCohortsRequest = typeof classroomio.cohort.$get;
type GetCohortsSuccess = Extract<InferResponseType<GetCohortsRequest>, { success: true }>;

export const load = async ({ parent, locals, cookies }) => {
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return { cohorts: [] };
  }

  const result = await safeServerApi<GetCohortsSuccess>(() =>
    classroomio.cohort.$get({ query: { organizationId: orgId } }, getApiHeaders(cookies, orgId))
  );

  return {
    cohorts: result.ok ? result.body.data : []
  };
};
