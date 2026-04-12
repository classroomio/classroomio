import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
type GetPublicCoursesSuccess = Extract<InferResponseType<GetPublicCoursesRequest>, { success: true }>;

export const load = async ({ parent }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    return {
      isOrgSite: false as const,
      org: null,
      orgSiteName: '',
      courses: [],
      hasMoreCourses: false
    };
  }

  const siteName = orgSiteName || org.siteName;
  if (!siteName) {
    return {
      isOrgSite: true as const,
      org,
      orgSiteName,
      courses: [],
      hasMoreCourses: false
    };
  }

  const coursesResult = await safeServerApi<GetPublicCoursesSuccess>(() =>
    classroomio.organization.courses.public.$get({
      query: { siteName }
    })
  );

  const courseData = coursesResult.ok ? coursesResult.body.data : { courses: [], hasMoreCourses: false };

  return {
    isOrgSite: true as const,
    org,
    orgSiteName,
    courses: courseData.courses,
    hasMoreCourses: courseData.hasMoreCourses
  };
};
