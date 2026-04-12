import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetOrganizationCoursesRequest = typeof classroomio.organization.courses.$get;
type GetOrganizationCoursesSuccess = Extract<InferResponseType<GetOrganizationCoursesRequest>, { success: true }>;

type GetProgramsRequest = typeof classroomio.program.$get;
type GetProgramsSuccess = Extract<InferResponseType<GetProgramsRequest>, { success: true }>;

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      courses: [],
      programs: []
    };
  }

  const [coursesResult, programsResult] = await Promise.all([
    safeServerApi<GetOrganizationCoursesSuccess>(() =>
      classroomio.organization.courses.$get({ query: {} }, getApiHeaders(cookies, orgId))
    ),
    safeServerApi<GetProgramsSuccess>(() =>
      classroomio.program.$get({ query: { organizationId: orgId } }, getApiHeaders(cookies, orgId))
    )
  ]);

  return {
    courses: coursesResult.ok ? coursesResult.body.data : [],
    programs: programsResult.ok ? programsResult.body.data : []
  };
};
