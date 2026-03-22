import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      audience: [],
      courses: []
    };
  }

  const headers = getApiHeaders(cookies, orgId);

  const [audienceResponse, coursesResponse] = await Promise.all([
    classroomio.organization.audience.$get({}, headers),
    classroomio.organization.courses.$get({ query: { tags: undefined } }, headers)
  ]);

  const audienceData = await audienceResponse.json();
  const audience = audienceData.success ? audienceData.data : [];

  const coursesData = await coursesResponse.json();
  const courses = coursesData.success ? coursesData.data : [];

  return {
    audience,
    courses
  };
};
