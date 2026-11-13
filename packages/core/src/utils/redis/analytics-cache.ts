import { env } from '../../config/env';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TAnalyticsScopeType } from '@cio/utils/constants/analytics';
import { logRedisUnavailableOnce, redis } from './redis';

export const ANALYTICS_TTL_SECONDS = { scope: 30, org: 60, structure: 600, plan: 60 } as const;

export const ANALYTICS_REFRESH_COOLDOWN_SECONDS = 15;

export type AnalyticsCacheSection = 'query' | 'dashboard' | 'structure' | 'plan';

export function analyticsKey(
  section: AnalyticsCacheSection,
  orgId: string,
  scopeType: TAnalyticsScopeType,
  scopeId: string,
  specHash?: string
): string {
  const parts = ['analytics', section, orgId, scopeType, scopeId];
  if (specHash) parts.push(specHash);

  return parts.join(':');
}

export function analyticsStructureKey(orgId: string, courseId: string): string {
  return analyticsKey('structure', orgId, 'course', courseId);
}

export function analyticsPlanKey(orgId: string): string {
  return analyticsKey('plan', orgId, 'org', orgId);
}

export function analyticsTtlSeconds(scopeType: TAnalyticsScopeType): number {
  return scopeType === 'org' ? ANALYTICS_TTL_SECONDS.org : ANALYTICS_TTL_SECONDS.scope;
}

/**
 * Claims the refresh slot for one user, scope and widget spec. True when this caller may recompute now. Fails open
 * without Redis.
 */
export async function claimAnalyticsRefresh(
  profileId: string,
  scopeType: TAnalyticsScopeType,
  scopeId: string,
  specHash: string
): Promise<boolean> {
  if (!env.REDIS_URL) return true;

  try {
    const claimed = await redis.set(`analytics:refresh:${profileId}:${scopeType}:${scopeId}:${specHash}`, '1', {
      NX: true,
      EX: ANALYTICS_REFRESH_COOLDOWN_SECONDS
    });

    return claimed === 'OK';
  } catch (error) {
    logRedisUnavailableOnce('Redis refresh gate failed for analytics, allowing refresh', error);
    return true;
  }
}

/**
 * Drops a scope's cached dashboard summary so the next load reads it fresh. Never throws.
 */
export async function invalidateAnalyticsDashboard(
  orgId: string,
  scopeType: TAnalyticsScopeType,
  scopeId: string
): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    await redis.del(analyticsKey('dashboard', orgId, scopeType, scopeId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for analytics dashboard, continuing', error);
  }
}

/**
 * Drops a course's cached outline and pass rules. Call after the change commits. Never throws.
 */
export async function invalidateAnalyticsCourseStructure(courseId: string): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    const orgId = await getCourseOrganizationId(courseId);
    if (!orgId) return;

    await redis.del(analyticsStructureKey(orgId, courseId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for analytics structure, continuing', error);
  }
}

/**
 * Drops an organization's cached active plan so the next range check reads it fresh. Never throws.
 */
export async function invalidateAnalyticsPlan(orgId: string): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    await redis.del(analyticsPlanKey(orgId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for analytics plan, continuing', error);
  }
}
