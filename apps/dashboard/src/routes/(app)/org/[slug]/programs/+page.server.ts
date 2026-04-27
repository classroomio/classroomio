import { classroomio, getApiHeaders, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetProgramsRequest = typeof classroomio.program.$get;
type GetProgramsSuccess = Extract<InferResponseType<GetProgramsRequest>, { success: true }>;

export const load = async ({ parent, locals, cookies }) => {
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return { programs: [] };
  }

  const result = await safeServerApi<GetProgramsSuccess>(() =>
    classroomio.program.$get({ query: { organizationId: orgId } }, getApiHeaders(cookies, orgId))
  );

  return {
    programs: result.ok ? result.body.data : []
  };
};
