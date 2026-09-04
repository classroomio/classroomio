import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getCourseStats,
  getDashOrgStats,
  getOrgStudentLoginsByDayOfWeek,
  getUserLoginStreak,
  getRecentCertifications,
  getTotalCertificatesIssued
} from '@cio/db/queries/dash';
import {
  invalidateOrgStats,
  readOrgStatsVersionAndCache,
  writeOrgStatsCache
} from '@cio/core/utils/redis/org-stats-cache';

import type { OrganisationAnalytics } from '@api/types';
import { getOrgIdBySiteName } from '@cio/db/queries';

async function loadOrganisationAnalyticsFromDatabase(orgId: string): Promise<OrganisationAnalytics> {
  const [stats, topCourses, recentCertificationRows, certificateCountRows] = await Promise.all([
    getDashOrgStats(orgId),
    getCourseStats(orgId),
    getRecentCertifications(orgId),
    getTotalCertificatesIssued(orgId)
  ]);

  const analytics: OrganisationAnalytics = {
    totalCertificates: certificateCountRows[0]?.count ?? 0,
    numberOfCourses: stats?.[0]?.noOfCourses ?? 0,
    totalStudents: stats?.[0]?.enrolledStudents ?? 0,
    topCourses: topCourses.map((course) => ({
      id: course.courseId,
      title: course.courseTitle,
      enrollments: course.totalStudents,
      completion: course.completionPercentage,
      certification: course.certificationPercentage
    })),
    recentCertifications: recentCertificationRows.map((row) => ({
      id: row.profileId,
      avatarUrl: row.avatarUrl,
      name: row.fullname,
      courseId: row.courseId,
      course: row.courseTitle,
      date: row.earnedAt ?? ''
    }))
  };

  return analytics;
}

export async function getOrganisationAnalytics(
  orgId?: string,
  siteName?: string,
  bustCache = false
): Promise<OrganisationAnalytics> {
  let resolvedOrgId = orgId;

  if (!resolvedOrgId && siteName) {
    const [org] = await getOrgIdBySiteName(siteName);

    if (org) {
      resolvedOrgId = org.id;
    } else {
      throw new AppError('Organization not found for the given site name', ErrorCodes.ORG_NOT_FOUND, 404);
    }
  }

  if (!resolvedOrgId) {
    throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
  }

  try {
    const { version, data: cached } = await readOrgStatsVersionAndCache<OrganisationAnalytics>(resolvedOrgId);

    if (!bustCache && cached) {
      return cached;
    }

    const analytics = await loadOrganisationAnalyticsFromDatabase(resolvedOrgId);
    await writeOrgStatsCache(resolvedOrgId, version, analytics);

    return analytics;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Failed to load organisation analytics:', error);
    throw new AppError('Failed to load organisation analytics', ErrorCodes.ORG_ANALYTICS_FETCH_FAILED, 500);
  }
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type StudentLoginActivityRow = { day: string; count: number };

/** Day-of-week login chart. This stays uncached because login writes happen in the auth database hook. */
export async function getStudentLoginActivity(orgId: string, days: number): Promise<StudentLoginActivityRow[]> {
  try {
    const rows = await getOrgStudentLoginsByDayOfWeek(orgId, days);

    const countByDow = new Map(rows.map((r) => [r.dayOfWeek, r.count]));

    return DAY_LABELS.map((label, index) => ({
      day: label,
      count: countByDow.get(index) ?? 0
    }));
  } catch (error) {
    console.error('getStudentLoginActivity error:', error);
    throw new AppError('Failed to load login activity', ErrorCodes.ORG_ANALYTICS_FETCH_FAILED, 500);
  }
}

export async function getCurrentUserLoginStreak(userId: string) {
  try {
    return await getUserLoginStreak(userId);
  } catch (error) {
    console.error('getCurrentUserLoginStreak error:', error);
    throw new AppError('Failed to load login streak', ErrorCodes.ORG_ANALYTICS_FETCH_FAILED, 500);
  }
}

export { invalidateOrgStats };
