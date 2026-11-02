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
