import { randomUUID } from 'node:crypto';

import { getSharedRedisConnection } from './connection';

const RELEASE_IF_OWNER_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
`;

export type TRedisLockResult<T> = { acquired: true; value: T } | { acquired: false };

/**
 * Runs `work` while holding a Redis lock on `key`, or reports `acquired: false` without running it.
 * The lock expires after `ttlMs` so a crashed holder cannot block the key forever.
 */
export async function withRedisLock<T>(
  key: string,
  ttlMs: number,
  work: () => Promise<T>
): Promise<TRedisLockResult<T>> {
  const connection = getSharedRedisConnection();
  const token = randomUUID();
  const lockKey = `lock:${key}`;
  const claimed = await connection.set(lockKey, token, 'PX', ttlMs, 'NX');

  if (claimed !== 'OK') return { acquired: false };

  try {
    return { acquired: true, value: await work() };
  } finally {
    await connection.eval(RELEASE_IF_OWNER_SCRIPT, 1, lockKey, token);
  }
}
