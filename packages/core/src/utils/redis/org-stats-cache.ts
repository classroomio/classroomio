import { env } from '../../config/env';
import { getOrgIdsByGroupIds } from '@cio/db/queries/group';
import { logRedisUnavailableOnce, redis } from './redis';

/** TTL for org dashboard stats payload (10 min). */
export const ORG_STATS_CACHE_TTL_SECONDS = 600;

export function orgStatsKey(orgId: string): string {
  return `dash:stats:v1:${orgId}`;
}

export function orgStatsVersionKey(orgId: string): string {
  return `dash:stats:ver:${orgId}`;
}

type VersionedOrgCachePayload<T> = {
  version: string;
  data: T;
};

function parseVersionedOrgCachePayload<T>(raw: string): VersionedOrgCachePayload<T> | null {
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

  return parsed as VersionedOrgCachePayload<T>;
}

/**
 * Reads any organization analytics payload against the same generation used
 * by the dashboard stats cache. A mutation can therefore invalidate every
 * analytics surface atomically by incrementing one version key.
 */
export async function readVersionedOrgCache<T>(
  orgId: string,
  payloadKey: string
): Promise<{ version: string; data: T | null }> {
  if (!env.REDIS_URL) {
    return { version: '0', data: null };
  }

  try {
    const versionKey = orgStatsVersionKey(orgId);
    const [versionRaw, payloadRaw] = await redis.mGet([versionKey, payloadKey]);
    const version = versionRaw ?? '0';

    if (!payloadRaw) {
      return { version, data: null };
    }

    const payload = parseVersionedOrgCachePayload<T>(payloadRaw);
    if (!payload || payload.version !== version) {
      return { version, data: null };
    }

    return { version, data: payload.data };
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for versioned org cache, using database', error);
    return { version: '0', data: null };
  }
}

export async function writeVersionedOrgCache<T>(
  payloadKey: string,
  ttlSeconds: number,
  version: string,
  value: T
): Promise<void> {
  if (!env.REDIS_URL) {
    return;
  }

  try {
    const payload: VersionedOrgCachePayload<T> = { version, data: value };
    await redis.setEx(payloadKey, ttlSeconds, JSON.stringify(payload));
  } catch (error) {
    logRedisUnavailableOnce('Redis set failed for versioned org cache, continuing', error);
  }
}

export function readOrgStatsVersionAndCache<T>(orgId: string): Promise<{ version: string; data: T | null }> {
  return readVersionedOrgCache<T>(orgId, orgStatsKey(orgId));
}

export function writeOrgStatsCache<T>(orgId: string, version: string, value: T): Promise<void> {
  return writeVersionedOrgCache(orgStatsKey(orgId), ORG_STATS_CACHE_TTL_SECONDS, version, value);
}

/** Invalidates the generation shared by org dashboard and analytics payloads. */
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
