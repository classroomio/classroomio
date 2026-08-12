import { env } from '../../config/env';
import { getOrgIdsByGroupIds } from '@cio/db/queries/group';
import { logRedisUnavailableOnce, redis } from './redis';

/** TTL for org dashboard stats payload (5 min). */
export const ORG_STATS_CACHE_TTL_SECONDS = 300;

export function orgStatsKey(orgId: string): string {
  return `dash:stats:v1:${orgId}`;
}

export function orgStatsVersionKey(orgId: string): string {
  return `dash:stats:ver:${orgId}`;
}

type CachedOrgStatsPayload<T> = {
  version: string;
  data: T;
};

function parseCachedOrgStatsPayload<T>(raw: string): CachedOrgStatsPayload<T> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('data' in parsed) ||
    typeof (parsed as { version: unknown }).version !== 'string' ||
    typeof (parsed as { data: unknown }).data !== 'object' ||
    (parsed as { data: unknown }).data === null
  ) {
    return null;
  }

  return parsed as CachedOrgStatsPayload<T>;
}

export async function readOrgStatsVersionAndCache<T>(orgId: string): Promise<{ version: string; data: T | null }> {
  if (!env.REDIS_URL) {
    return { version: '0', data: null };
  }

  try {
    const versionKey = orgStatsVersionKey(orgId);
    const payloadKey = orgStatsKey(orgId);
    const [versionRaw, payloadRaw] = await redis.mGet([versionKey, payloadKey]);
    const version = versionRaw ?? '0';

    if (!payloadRaw) {
      return { version, data: null };
    }

    const payload = parseCachedOrgStatsPayload<T>(payloadRaw);
    if (!payload || payload.version !== version) {
      return { version, data: null };
    }

    return { version, data: payload.data };
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for org stats cache, using database', error);
    return { version: '0', data: null };
  }
}

export async function writeOrgStatsCache<T>(orgId: string, version: string, value: T): Promise<void> {
  if (!env.REDIS_URL) {
    return;
  }

  try {
    const payload: CachedOrgStatsPayload<T> = { version, data: value };
    await redis.setEx(orgStatsKey(orgId), ORG_STATS_CACHE_TTL_SECONDS, JSON.stringify(payload));
  } catch (error) {
    logRedisUnavailableOnce('Redis set failed for org stats cache, continuing', error);
  }
}

export async function invalidateOrgStats(orgId: string | null | undefined): Promise<void> {
  if (!orgId || !env.REDIS_URL) {
    return;
  }

  try {
    await redis.incr(orgStatsVersionKey(orgId));
    await redis.del(orgStatsKey(orgId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for org stats cache, continuing', error);
  }
}

export async function invalidateOrgStatsForIds(orgIds: string[]): Promise<void> {
  const uniqueOrgIds = [...new Set(orgIds.filter((orgId) => Boolean(orgId)))];

  for (const orgId of uniqueOrgIds) {
    await invalidateOrgStats(orgId);
  }
}

export async function invalidateOrgStatsForGroupIds(groupIds: string[]): Promise<void> {
  const orgIds = await getOrgIdsByGroupIds(groupIds);
  await invalidateOrgStatsForIds(orgIds);
}
