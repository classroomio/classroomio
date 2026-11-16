import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

export type CachedRead<T> = { data: T; generatedAt: string };

export type CachedReadOptions = { refresh?: boolean };

const LOCK_TTL_SECONDS = 30;
const LOCK_WAIT_MS = 100;
const LOCK_WAIT_ATTEMPTS = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readEntry<T>(key: string): Promise<CachedRead<T> | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as CachedRead<T>) : null;
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for cached read, using database', error);
    return null;
  }
}

async function tryLock(lockKey: string): Promise<'acquired' | 'held' | 'unavailable'> {
  try {
    return (await redis.set(lockKey, '1', { NX: true, EX: LOCK_TTL_SECONDS })) === 'OK' ? 'acquired' : 'held';
  } catch (error) {
    logRedisUnavailableOnce('Redis lock failed for cached read, using database', error);
    return 'unavailable';
  }
}

function isNewEnough<T>(entry: CachedRead<T>, notBefore: number | null): boolean {
  return notBefore === null || Date.parse(entry.generatedAt) >= notBefore;
}

async function waitForEntry<T>(key: string, notBefore: number | null): Promise<CachedRead<T> | null> {
  for (let attempt = 0; attempt < LOCK_WAIT_ATTEMPTS; attempt++) {
    await sleep(LOCK_WAIT_MS);
    const entry = await readEntry<T>(key);
    if (entry && isNewEnough(entry, notBefore)) return entry;
  }

  return null;
}

/**
 * Cache-aside read with stampede protection. On a miss, one caller takes `{key}:lock` and computes; the others wait
 * up to ~2s for its result, then compute anyway so a stuck lock never blocks reads. With `refresh`, the read is
 * skipped and the entry is overwritten; the old entry keeps serving other readers until then, and a refresh that
 * finds the lock held waits only for an entry generated after it started. Without Redis it just computes.
 */
export async function cachedRead<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  options: CachedReadOptions = {}
): Promise<CachedRead<T>> {
  if (!env.REDIS_URL) {
    return { data: await compute(), generatedAt: new Date().toISOString() };
  }

  const startedAt = Date.now();

  if (!options.refresh) {
    const cached = await readEntry<T>(key);
    if (cached) return cached;
  }

  const lockKey = `${key}:lock`;
  const lock = await tryLock(lockKey);
  const hasLock = lock === 'acquired';

  if (lock === 'held') {
    const notBefore = options.refresh ? startedAt : null;
    const filled = await waitForEntry<T>(key, notBefore);
    if (filled) return filled;
  }

  try {
    const entry: CachedRead<T> = { data: await compute(), generatedAt: new Date().toISOString() };

    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      logRedisUnavailableOnce('Redis set failed for cached read, continuing', error);
    }

    return entry;
  } finally {
    if (hasLock) {
      await redis.del(lockKey).catch(() => undefined);
    }
  }
}
