import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

const PENDING = 'pending';
const DONE = 'done';
const PENDING_TTL_SECONDS = 60;
const DONE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * `claimed`: this caller owns the key and must `complete` or `release` it. `done`: an earlier request applied it.
 * `busy`: another request is applying it right now. `unavailable`: no Redis, so duplicates cannot be detected.
 */
export type IdempotencyClaim = 'claimed' | 'done' | 'busy' | 'unavailable';

export type IdempotencyStore = {
  claim(key: string): Promise<IdempotencyClaim>;
  complete(key: string): Promise<void>;
  release(key: string): Promise<void>;
};

export function createRedisIdempotencyStore(namespace: string): IdempotencyStore {
  const keyOf = (key: string) => `idempotency:${namespace}:${key}`;

  return {
    async claim(key) {
      if (!env.REDIS_URL) return 'unavailable';

      try {
        const claimed = await redis.set(keyOf(key), PENDING, { NX: true, EX: PENDING_TTL_SECONDS });
        if (claimed === 'OK') return 'claimed';

        return (await redis.get(keyOf(key))) === DONE ? 'done' : 'busy';
      } catch (error) {
        logRedisUnavailableOnce('Redis unavailable for idempotency keys, applying without duplicate checks', error);
        return 'unavailable';
      }
    },
    async complete(key) {
      if (!env.REDIS_URL) return;

      await redis.set(keyOf(key), DONE, { EX: DONE_TTL_SECONDS }).catch((error: unknown) => {
        logRedisUnavailableOnce('Redis SET idempotency key failed', error);
      });
    },
    async release(key) {
      if (!env.REDIS_URL) return;

      await redis.del(keyOf(key)).catch((error: unknown) => {
        logRedisUnavailableOnce('Redis DEL idempotency key failed', error);
      });
    }
  };
}
