import { orgHasActiveWebhookEndpoint } from '@cio/db/queries/webhook';

import { env } from '../../config/env';
import { logRedisUnavailableOnce, redis } from '../../utils/redis/redis';

const ORG_HAS_ENDPOINTS_TTL_SECONDS = 300;
const COURSE_ORGANIZATION_TTL_SECONDS = 600;

function hasEndpointsKey(organizationId: string): string {
  return `webhook:has-endpoints:v1:${organizationId}`;
}

function courseOrganizationKey(courseId: string): string {
  return `webhook:course-org:v1:${courseId}`;
}

function isCacheAvailable(): boolean {
  return Boolean(env.REDIS_URL) && redis.isReady;
}

export async function readOrgHasWebhookEndpoints(organizationId: string): Promise<boolean | null> {
  if (!isCacheAvailable()) return null;

  try {
    const cached = await redis.get(hasEndpointsKey(organizationId));

    return cached === null ? null : cached === '1';
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for webhook endpoint cache, using database', error);

    return null;
  }
}

export async function writeOrgHasWebhookEndpoints(organizationId: string, hasEndpoints: boolean): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    await redis.setEx(hasEndpointsKey(organizationId), ORG_HAS_ENDPOINTS_TTL_SECONDS, hasEndpoints ? '1' : '0');
  } catch (error) {
    logRedisUnavailableOnce('Redis set failed for webhook endpoint cache, continuing', error);
  }
}

export async function invalidateOrgWebhookEndpoints(organizationId: string): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    await redis.del(hasEndpointsKey(organizationId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for webhook endpoint cache, continuing', error);
  }
}

/**
 * Stores the org's current answer in the cache after its webhooks change, and drops the cached
 * answer instead when the answer cannot be read.
 */
export async function refreshOrgHasWebhookEndpoints(organizationId: string): Promise<void> {
  try {
    const hasEndpoints = await orgHasActiveWebhookEndpoint(organizationId);

    await writeOrgHasWebhookEndpoints(organizationId, hasEndpoints);
  } catch (error) {
    console.error('refreshOrgHasWebhookEndpoints error:', { organizationId, error });
    await invalidateOrgWebhookEndpoints(organizationId);
  }
}

export async function readCachedCourseOrganizationId(courseId: string): Promise<string | null> {
  if (!isCacheAvailable()) return null;

  try {
    return await redis.get(courseOrganizationKey(courseId));
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for webhook course cache, using database', error);

    return null;
  }
}

export async function writeCachedCourseOrganizationId(courseId: string, organizationId: string): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    await redis.setEx(courseOrganizationKey(courseId), COURSE_ORGANIZATION_TTL_SECONDS, organizationId);
  } catch (error) {
    logRedisUnavailableOnce('Redis set failed for webhook course cache, continuing', error);
  }
}
