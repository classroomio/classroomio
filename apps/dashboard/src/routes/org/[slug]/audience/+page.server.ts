import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import {
  DEFAULT_ORG_AUDIENCE_QUERY,
  getAudienceQueryFromSearchParams,
  toAudienceRequestQuery
} from '$lib/features/org/utils/audience-query-utils';

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

  const [audienceResponse, coursesResponse] = await Promise.all([
    classroomio.organization.audience.$get({ query: toAudienceRequestQuery(query)! }, headers),
    classroomio.organization.courses.$get({ query: { tags: undefined } }, headers)
  ]);

  const audienceData = await audienceResponse.json();
  const audience = audienceData.success ? audienceData.data : [];
  const pagination = audienceData.success ? audienceData.pagination : null;

  const coursesData = await coursesResponse.json();
  const courses = coursesData.success ? coursesData.data : [];

  return {
    audience,
    pagination,
    query,
    courses
  };
};
