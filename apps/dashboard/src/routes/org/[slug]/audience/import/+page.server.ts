import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      courses: []
    };
  }

  const coursesResponse = await classroomio.organization.courses.$get({}, getApiHeaders(cookies, orgId));
  const coursesData = await coursesResponse.json();
  const courses = coursesData.success ? coursesData.data : [];

  return {
    courses
  };
};
