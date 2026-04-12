import type { InferResponseType } from '$lib/utils/services/api';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import {
  DEFAULT_ORG_AUDIENCE_QUERY,
  getAudienceQueryFromSearchParams,
  toAudienceRequestQuery
} from '$lib/features/org/utils/audience-query-utils';
import type { OrganizationAudienceSuccess } from '$lib/features/org/utils/types';

type GetOrganizationCoursesRequest = typeof classroomio.organization.courses.$get;
type GetOrganizationCoursesSuccess = Extract<InferResponseType<GetOrganizationCoursesRequest>, { success: true }>;

export const load = async ({ parent, cookies, url }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      audience: [],
      pagination: null,
      query: DEFAULT_ORG_AUDIENCE_QUERY,
      courses: []
    };
  }

  const headers = getApiHeaders(cookies, orgId);
  const query = getAudienceQueryFromSearchParams(url.searchParams);

  const [audienceResult, coursesResult] = await Promise.all([
    safeServerApi<OrganizationAudienceSuccess>(() =>
      classroomio.organization.audience.$get({ query: toAudienceRequestQuery(query)! }, headers)
    ),
    safeServerApi<GetOrganizationCoursesSuccess>(() =>
      classroomio.organization.courses.$get({ query: { tags: undefined } }, headers)
    )
  ]);
  const audience = audienceResult.ok ? audienceResult.body.data : [];
  const pagination = audienceResult.ok ? audienceResult.body.pagination : null;
  const courses = coursesResult.ok ? coursesResult.body.data : [];

  return {
    audience,
    pagination,
    query,
    courses
  };
};
