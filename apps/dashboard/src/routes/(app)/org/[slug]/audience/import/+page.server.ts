import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetOrganizationCoursesRequest = typeof classroomio.organization.courses.$get;
type GetOrganizationCoursesSuccess = Extract<InferResponseType<GetOrganizationCoursesRequest>, { success: true }>;

type GetCohortsRequest = typeof classroomio.cohort.$get;
type GetCohortsSuccess = Extract<InferResponseType<GetCohortsRequest>, { success: true }>;

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      courses: [],
      cohorts: []
    };
  }

  const [coursesResult, cohortsResult] = await Promise.all([
    safeServerApi<GetOrganizationCoursesSuccess>(() =>
      classroomio.organization.courses.$get({ query: {} }, getApiHeaders(cookies, orgId))
    ),
    safeServerApi<GetCohortsSuccess>(() =>
      classroomio.cohort.$get({ query: { organizationId: orgId } }, getApiHeaders(cookies, orgId))
    )
  ]);

  return {
    courses: coursesResult.ok ? coursesResult.body.data : [],
    cohorts: cohortsResult.ok ? cohortsResult.body.data : []
  };
};
