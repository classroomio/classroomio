import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type GetPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
type GetPublicCoursesSuccess = Extract<InferResponseType<GetPublicCoursesRequest>, { success: true }>;
type GetPublicLearningPathsRequest = (typeof classroomio.organization)['learning-paths']['public']['$get'];
type GetPublicLearningPathsSuccess = Extract<InferResponseType<GetPublicLearningPathsRequest>, { success: true }>;

export const load = async ({ parent }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    return {
      isOrgSite: false as const,
      org: null,
      orgSiteName: '',
      courses: [],
      hasMoreCourses: false,
      learningPaths: [],
      hasMoreLearningPaths: false
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
      learningPaths: [],
      hasMoreLearningPaths: false
    };
  }

  const [coursesResult, learningPathsResult] = await Promise.all([
    safeServerApi<GetPublicCoursesSuccess>(() =>
      classroomio.organization.courses.public.$get({
        query: { siteName }
      })
    ),
    safeServerApi<GetPublicLearningPathsSuccess>(() =>
      classroomio.organization['learning-paths'].public.$get({
        query: { siteName }
      })
    )
  ]);

  const courseData = coursesResult.ok ? coursesResult.body.data : { courses: [], hasMoreCourses: false };
  const learningPathData = learningPathsResult.ok
    ? learningPathsResult.body.data
    : { learningPaths: [], hasMoreLearningPaths: false };

  return {
    isOrgSite: true as const,
    org,
    orgSiteName,
    courses: courseData.courses,
    hasMoreCourses: courseData.hasMoreCourses,
    learningPaths: learningPathData.learningPaths,
    hasMoreLearningPaths: learningPathData.hasMoreLearningPaths
  };
};
