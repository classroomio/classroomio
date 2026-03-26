import { redis } from './redis';

/**
 * Gets a value from Redis cache or fetches it and caches it if missing.
 * @param key The Redis cache key
 * @param fetcher The function to fetch the raw data if not cached
 * @param ttlSeconds Time to live in seconds (default: 3600 = 1 hour)
 */
export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.error(`Cache read error for key ${key}:`, err);
    // If Redis fails, gracefully fall back to executing fetcher
  }

  const data = await fetcher();

  try {
    if (data !== undefined && data !== null) {
      await redis.set(key, JSON.stringify(data), {
        EX: ttlSeconds
      });
    }
  } catch (err) {
    console.error(`Cache write error for key ${key}:`, err);
  }

  return data;
}

/**
 * Invalidates cache by deleting all keys matching a specific pattern.
 * Uses SCAN to safely find and delete keys without blocking Redis.
 * @param pattern The pattern to match (e.g. "dash:stats:org-id-*")
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = result.cursor;
      keysToDelete.push(...result.keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      // Delete in chunks to avoid blocking
      for (let i = 0; i < keysToDelete.length; i += 100) {
        const chunk = keysToDelete.slice(i, i + 100);
        await redis.del(chunk);
      }
    }
  } catch (err) {
    console.error(`Cache invalidation error for pattern ${pattern}:`, err);
  }
}

/**
 * Deletes a specific cache key
 * @param key The key to delete
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Cache invalidation error for key ${key}:`, err);
  }
}
