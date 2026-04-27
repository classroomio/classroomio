import { AppError, ErrorCodes } from '@api/utils/errors';
import { env } from '@api/config/env';
import {
  getCourseStats,
  getDashOrgStats,
  getOrgStudentLoginsByDayOfWeek,
  getUserLoginStreak,
  getRecentCertifications,
  getTotalCertificatesIssued
} from '@cio/db/queries/dash';
import { dashLoginActivityKey } from '@api/utils/redis/key-generators';
import { logRedisUnavailableOnce, redis } from '@api/utils/redis/redis';

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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type StudentLoginActivityRow = { day: string; count: number };

/** Redis TTL for login-activity chart payload (1 day). */
const LOGIN_ACTIVITY_CACHE_TTL_SECONDS = 86_400;

function parseLoginActivityCache(raw: string): StudentLoginActivityRow[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length !== 7) {
    return null;
  }

  const out: StudentLoginActivityRow[] = [];
  for (const item of parsed) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('day' in item) ||
      !('count' in item) ||
      typeof (item as { day: unknown }).day !== 'string' ||
      typeof (item as { count: unknown }).count !== 'number' ||
      !Number.isInteger((item as { count: number }).count) ||
      (item as { count: number }).count < 0
    ) {
      return null;
    }

    out.push({ day: (item as { day: string }).day, count: (item as { count: number }).count });
  }

  for (const label of DAY_LABELS) {
    if (!out.some((r) => r.day === label)) {
      return null;
    }
  }

  return out;
}

/** Day-of-week login chart; results cached in Redis (24h TTL) when `REDIS_URL` is set. */
export async function getStudentLoginActivity(orgId: string, days: number): Promise<StudentLoginActivityRow[]> {
  const cacheKey = dashLoginActivityKey(orgId, days);

  if (env.REDIS_URL) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const rows = parseLoginActivityCache(cached);
        if (rows) {
          return rows;
        }
      }
    } catch (error) {
      logRedisUnavailableOnce('Redis get failed for login activity cache, using database', error);
    }
  }

  try {
    const rows = await getOrgStudentLoginsByDayOfWeek(orgId, days);

    const countByDow = new Map(rows.map((r) => [r.dayOfWeek, r.count]));

    const result = DAY_LABELS.map((label, index) => ({
      day: label,
      count: countByDow.get(index) ?? 0
    }));

    if (env.REDIS_URL) {
      try {
        await redis.setEx(cacheKey, LOGIN_ACTIVITY_CACHE_TTL_SECONDS, JSON.stringify(result));
      } catch (error) {
        logRedisUnavailableOnce('Redis set failed for login activity cache, continuing', error);
      }
    }

    return result;
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
