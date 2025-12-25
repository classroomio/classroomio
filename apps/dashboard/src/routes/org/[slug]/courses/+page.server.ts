import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, locals, cookies }) => {
  const { org } = await parent();

  if (!org?.id || !locals.user?.id) {
    return {
      courses: []
    };
  }

  const coursesResponse = await classroomio.organization.courses.$get(
    { query: { siteName: org.siteName } },
    getApiHeaders(cookies, org.id)
  );

  const coursesData = await coursesResponse.json();
  const courses = coursesData.success ? coursesData.data : [];

  return {
    courses: courses || []
  };
};
