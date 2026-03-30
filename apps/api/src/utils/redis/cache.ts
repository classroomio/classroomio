import { redis } from './redis';

const CACHE_INDEX_PREFIX = 'cache:index';

/**
 * Registers a cache key under an org index so it can be explicitly invalidated later.
 */
export async function registerCacheKey(indexKey: string, cacheKey: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.sAdd(`${CACHE_INDEX_PREFIX}:${indexKey}`, cacheKey);
    // Index TTL slightly longer than the cache entry itself
    await redis.expire(`${CACHE_INDEX_PREFIX}:${indexKey}`, ttlSeconds + 60);
  } catch (err) {
    console.error(`Cache index registration error:`, err);
  }
}

/**
 * Invalidates all keys registered under an index (e.g. all keys for an org).
 */
export async function invalidateCacheIndex(indexKey: string): Promise<void> {
  try {
    const keys = await redis.sMembers(`${CACHE_INDEX_PREFIX}:${indexKey}`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    await redis.del(`${CACHE_INDEX_PREFIX}:${indexKey}`);
  } catch (err) {
    console.error(`Cache index invalidation error for "${indexKey}":`, err);
  }
}

/**
 * Deletes a specific cache key.
 */
export async function invalidateCacheKey(key: string | string[]): Promise<void> {
  try {
    await redis.del(Array.isArray(key) ? key : [key]);
  } catch (err) {
    console.error(`Cache invalidation error:`, err);
  }
}