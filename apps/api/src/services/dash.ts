import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseStats, getDashOrgStats, getRecentEnrollments } from '@cio/db/queries/dash';

import { OrganisationAnalytics } from '@api/types';
import { getOrgIdBySiteName } from '@db/queries';

export async function getOrganisationAnalytics(orgId?: string, siteName?: string): Promise<OrganisationAnalytics> {
  const analytics: OrganisationAnalytics = {
    revenue: 0,
    numberOfCourses: 0,
    totalStudents: 0,
    topCourses: [],
    enrollments: []
  };

  let resolvedOrgId = orgId;

  if (!resolvedOrgId && siteName) {
    const [org] = await getOrgIdBySiteName(siteName);

    if (org) {
      resolvedOrgId = org.id;
    } else {
      throw new AppError('Organization not found for the given site name', ErrorCodes.ORG_NOT_FOUND, 404);
    }
  }

  try {
    const [stats, topCourses, enrollments] = await Promise.all([
      getDashOrgStats(resolvedOrgId!),
      getCourseStats(resolvedOrgId!),
      getRecentEnrollments(resolvedOrgId!)
    ]);

    analytics.revenue = 0;
    analytics.numberOfCourses = stats?.[0]?.noOfCourses ?? 0;
    analytics.totalStudents = stats?.[0]?.enrolledStudents ?? 0;

    analytics.topCourses = topCourses.map((c) => ({
      id: c.courseId,
      title: c.courseTitle,
      enrollments: c.totalStudents,
      completion: c.completionPercentage
    }));

    analytics.enrollments = enrollments.map((e) => ({
      id: e.profileId,
      avatarUrl: e.avatarUrl,
      name: e.fullname,
      courseId: e.courseId,
      course: e.courseTitle,
      date: e.enrolledAt
    }));

    return analytics;
  } catch (error) {
    console.error('Failed to load organisation analytics:', error);
    throw new AppError('Failed to load organisation analytics', ErrorCodes.ORG_ANALYTICS_FETCH_FAILED, 500);
  }
}
