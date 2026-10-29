import { env } from '../../config/env';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import { logRedisUnavailableOnce, redis } from './redis';

export const INSIGHTS_TTL_SECONDS = { scope: 30, org: 60, structure: 600, plan: 60 } as const;

export const INSIGHTS_REFRESH_COOLDOWN_SECONDS = 15;

export type InsightsCacheSection = 'query' | 'dashboard' | 'structure' | 'plan';

export function insightsKey(
  section: InsightsCacheSection,
  orgId: string,
  scopeType: TInsightsScopeType,
  scopeId: string,
  specHash?: string
): string {
  const parts = ['insights', section, orgId, scopeType, scopeId];
  if (specHash) parts.push(specHash);

  return parts.join(':');
}

export function insightsStructureKey(orgId: string, courseId: string): string {
  return insightsKey('structure', orgId, 'course', courseId);
}

export function insightsPlanKey(orgId: string): string {
  return insightsKey('plan', orgId, 'org', orgId);
}

export function insightsTtlSeconds(scopeType: TInsightsScopeType): number {
  return scopeType === 'org' ? INSIGHTS_TTL_SECONDS.org : INSIGHTS_TTL_SECONDS.scope;
}

/**
 * Claims the refresh slot for one user, scope and widget spec. True when this caller may recompute now. Fails open
 * without Redis.
 */
export async function claimInsightsRefresh(
  profileId: string,
  scopeType: TInsightsScopeType,
  scopeId: string,
  specHash: string
): Promise<boolean> {
  if (!env.REDIS_URL) return true;

  try {
    const claimed = await redis.set(`insights:refresh:${profileId}:${scopeType}:${scopeId}:${specHash}`, '1', {
      NX: true,
      EX: INSIGHTS_REFRESH_COOLDOWN_SECONDS
    });

    return claimed === 'OK';
  } catch (error) {
    logRedisUnavailableOnce('Redis refresh gate failed for insights, allowing refresh', error);
    return true;
  }
}

/**
 * Drops a scope's cached dashboard summary so the next load reads it fresh. Never throws.
 */
export async function invalidateInsightsDashboard(
  orgId: string,
  scopeType: TInsightsScopeType,
  scopeId: string
): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    await redis.del(insightsKey('dashboard', orgId, scopeType, scopeId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for insights dashboard, continuing', error);
  }
}

/**
 * Drops a course's cached outline and pass rules. Call after the change commits. Never throws.
 */
export async function invalidateInsightsCourseStructure(courseId: string): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    const orgId = await getCourseOrganizationId(courseId);
    if (!orgId) return;

    await redis.del(insightsStructureKey(orgId, courseId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for insights structure, continuing', error);
  }
}

/**
 * Drops an organization's cached active plan so the next range check reads it fresh. Never throws.
 */
export async function invalidateInsightsPlan(orgId: string): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    await redis.del(insightsPlanKey(orgId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for insights plan, continuing', error);
  }
}
