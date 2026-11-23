import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

const TTL_SECONDS = 90 * 24 * 60 * 60;

const keyOf = (profileId: string, lessonId: string) => `offline-issue:${profileId}:${lessonId}`;

/** Remembers when a learner first received each lesson for offline use; later downloads keep the earlier time. */
export async function recordOfflineIssue(profileId: string, lessonIds: string[]): Promise<void> {
  if (!env.REDIS_URL || lessonIds.length === 0) return;

  const now = String(Date.now());
  try {
    await Promise.all(
      lessonIds.map((lessonId) => redis.set(keyOf(profileId, lessonId), now, { NX: true, EX: TTL_SECONDS }))
    );
  } catch (error) {
    logRedisUnavailableOnce('Redis SET offline-issue failed', error);
  }
}

/** Milliseconds since epoch when the lesson was first downloaded, or null when unknown. */
export async function readOfflineIssue(profileId: string, lessonId: string): Promise<number | null> {
  if (!env.REDIS_URL) return null;

  try {
    const value = await redis.get(keyOf(profileId, lessonId));

    return value ? Number(value) : null;
  } catch (error) {
    logRedisUnavailableOnce('Redis GET offline-issue failed', error);
    return null;
  }
}

const cursorKeyOf = (profileId: string, lessonId: string, assetId: string) =>
  `offline-watch-cursor:${profileId}:${lessonId}:${assetId}`;

/** When the latest offline watch time already credited for this video was recorded, or null when none or unknown. */
export async function readOfflineWatchCursor(
  profileId: string,
  lessonId: string,
  assetId: string
): Promise<number | null> {
  if (!env.REDIS_URL) return null;

  try {
    const value = await redis.get(cursorKeyOf(profileId, lessonId, assetId));

    return value ? Number(value) : null;
  } catch (error) {
    logRedisUnavailableOnce('Redis GET offline-watch-cursor failed', error);
    return null;
  }
}

/** Moves the credited-until time forward so a later sync request cannot claim the same watch time again. */
export async function advanceOfflineWatchCursor(
  profileId: string,
  lessonId: string,
  assetId: string,
  recordedAt: number
): Promise<void> {
  if (!env.REDIS_URL) return;

  const key = cursorKeyOf(profileId, lessonId, assetId);
  try {
    const current = Number((await redis.get(key)) ?? 0);
    if (recordedAt > current) await redis.set(key, String(recordedAt), { EX: TTL_SECONDS });
  } catch (error) {
    logRedisUnavailableOnce('Redis SET offline-watch-cursor failed', error);
  }
}
