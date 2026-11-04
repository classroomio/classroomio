import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
type GetPublicCoursesSuccess = Extract<InferResponseType<GetPublicCoursesRequest>, { success: true }>;

type GetPublicLandingPageRequest = (typeof classroomio.organization)['landing-page']['public']['$get'];
type GetPublicLandingPageSuccess = Extract<InferResponseType<GetPublicLandingPageRequest>, { success: true }>;

export const load = async ({ parent }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    return {
      isOrgSite: false as const,
      org: null,
      orgSiteName: '',
      courses: [],
      hasMoreCourses: false,
      pluginDescriptor: null
    };
  }

  const siteName = orgSiteName || org.siteName;
  if (!siteName) {
    return {
      isOrgSite: true as const,
      org,
      orgSiteName,
      courses: [],
      hasMoreCourses: false,
      pluginDescriptor: null
    };
  }

  const coursesResult = await safeServerApi<GetPublicCoursesSuccess>(() =>
    classroomio.organization.courses.public.$get({
      query: { siteName }
    })
  );

  const courseData = coursesResult.ok ? coursesResult.body.data : { courses: [], hasMoreCourses: false };

  const rawLanding = (org.landingpage ?? {}) as Record<string, unknown>;
  const appearance = rawLanding.appearance as Record<string, unknown> | undefined;

  let pluginDescriptor = null;
  if (appearance?.kind === 'plugin') {
    const landingResult = await safeServerApi<GetPublicLandingPageSuccess>(() =>
      classroomio.organization['landing-page'].public.$get({
        query: { siteName }
      })
    );

    if (landingResult.ok && landingResult.body.data.isPlugin && landingResult.body.data.pluginDescriptor) {
      pluginDescriptor = landingResult.body.data.pluginDescriptor;
    }
  }

  return {
    isOrgSite: true as const,
    org,
    orgSiteName,
    courses: courseData.courses,
    hasMoreCourses: courseData.hasMoreCourses,
    pluginDescriptor
  };
};
