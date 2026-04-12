import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getCourseStats,
  getDashOrgStats,
  getRecentCertifications,
  getTotalCertificatesIssued
} from '@cio/db/queries/dash';

import { OrganisationAnalytics } from '@api/types';
import { getOrgIdBySiteName } from '@cio/db/queries';

export async function getOrganisationAnalytics(orgId?: string, siteName?: string): Promise<OrganisationAnalytics> {
  const analytics: OrganisationAnalytics = {
    totalCertificates: 0,
    numberOfCourses: 0,
    totalStudents: 0,
    topCourses: [],
    recentCertifications: []
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
    const [stats, topCourses, recentCertificationRows, certificateCountRows] = await Promise.all([
      getDashOrgStats(resolvedOrgId!),
      getCourseStats(resolvedOrgId!),
      getRecentCertifications(resolvedOrgId!),
      getTotalCertificatesIssued(resolvedOrgId!)
    ]);

    analytics.totalCertificates = certificateCountRows[0]?.count ?? 0;
    analytics.numberOfCourses = stats?.[0]?.noOfCourses ?? 0;
    analytics.totalStudents = stats?.[0]?.enrolledStudents ?? 0;

    analytics.topCourses = topCourses.map((c) => ({
      id: c.courseId,
      title: c.courseTitle,
      enrollments: c.totalStudents,
      completion: c.completionPercentage,
      certification: c.certificationPercentage
    }));

    analytics.recentCertifications = recentCertificationRows.map((row) => ({
      id: row.profileId,
      avatarUrl: row.avatarUrl,
      name: row.fullname,
      courseId: row.courseId,
      course: row.courseTitle,
      date: row.earnedAt ?? ''
    }));

    return analytics;
  } catch (error) {
    console.error('Failed to load organisation analytics:', error);
    throw new AppError('Failed to load organisation analytics', ErrorCodes.ORG_ANALYTICS_FETCH_FAILED, 500);
  }
}
