import { getUserOrgRolesMap } from '@cio/db/queries/organization';
import { logRedisUnavailableOnce, redis } from './redis';

const TTL_SECONDS = 60 * 60; // 1 hour, matches the prior cookieCache.maxAge.

const cacheKey = (userId: string) => `org-roles:${userId}`;

export async function getOrgRolesForUser(userId: string): Promise<Record<string, number>> {
  try {
    const cached = await redis.get(cacheKey(userId));
    if (cached) {
      try {
        return JSON.parse(cached) as Record<string, number>;
      } catch {
        // Stale/corrupt entry — fall through to DB.
      }
    }
  } catch (error) {
    logRedisUnavailableOnce('Redis GET org-roles failed, falling back to DB', error);
  }

  const orgRoles = await getUserOrgRolesMap(userId);

  try {
    await redis.set(cacheKey(userId), JSON.stringify(orgRoles), { EX: TTL_SECONDS });
  } catch (error) {
    logRedisUnavailableOnce('Redis SET org-roles failed, cache disabled', error);
  }

  return orgRoles;
}

export async function invalidateOrgRolesCache(userId: string): Promise<void> {
  try {
    await redis.del(cacheKey(userId));
  } catch (error) {
    logRedisUnavailableOnce('Redis DEL org-roles failed, falling back to TTL', error);
  }
}
