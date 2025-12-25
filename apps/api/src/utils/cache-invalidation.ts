/**
 * Cache invalidation utilities
 * Provides functions to invalidate related cache entries when data changes
 */

import { Cache } from './redis/cache';
import {
  orgCacheKey,
  orgBySiteNameCacheKey,
  orgCoursesCacheKey,
  orgSetupCacheKey,
  orgTeamCacheKey,
  orgAudienceCacheKey,
  dashStatsCacheKey
} from './redis/cache-keys';

/**
 * Invalidate all organization-related cache entries
 */
export async function invalidateOrgCache(orgId: string, siteName?: string): Promise<void> {
  const keys = [
    orgCacheKey(orgId),
    orgTeamCacheKey(orgId),
    orgAudienceCacheKey(orgId),
    dashStatsCacheKey(orgId, siteName)
  ];

  if (siteName) {
    keys.push(
      orgBySiteNameCacheKey(siteName),
      orgCoursesCacheKey(siteName),
      orgSetupCacheKey(siteName)
    );
  }

  await Promise.all(keys.map((key) => Cache.del(key)));
}

/**
 * Invalidate organization courses cache
 */
export async function invalidateOrgCoursesCache(siteName: string): Promise<void> {
  await Cache.del(orgCoursesCacheKey(siteName));
  // Also invalidate setup cache as it includes courses
  await Cache.del(orgSetupCacheKey(siteName));
}

/**
 * Invalidate organization team cache
 */
export async function invalidateOrgTeamCache(orgId: string): Promise<void> {
  await Cache.del(orgTeamCacheKey(orgId));
}

/**
 * Invalidate organization audience cache
 */
export async function invalidateOrgAudienceCache(orgId: string): Promise<void> {
  await Cache.del(orgAudienceCacheKey(orgId));
}

/**
 * Invalidate dashboard stats cache
 */
export async function invalidateDashStatsCache(orgId: string, siteName?: string): Promise<void> {
  await Cache.del(dashStatsCacheKey(orgId, siteName));
}

/**
 * Invalidate cache by pattern (useful for bulk operations)
 * @example
 * // Invalidate all course-related cache
 * await invalidateCachePattern('course:*');
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  return Cache.invalidatePattern(pattern);
}