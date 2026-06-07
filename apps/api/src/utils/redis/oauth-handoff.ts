import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

const KEY = (token: string) => `oauth-handoff:${token}`;
const TTL_SECONDS = 120; // OAuth callbacks usually finish in < 2s; 2 minutes gives plenty of slack.

export async function storeHandoffPayload(token: string, payload: string): Promise<void> {
  try {
    await redis.set(KEY(token), payload, { EX: TTL_SECONDS });
  } catch (error) {
    logRedisUnavailableOnce('Redis SET oauth-handoff failed', error);
    throw new Error('Failed to store OAuth handoff payload');
  }
}

export async function consumeHandoffPayload(token: string): Promise<string | null> {
  try {
    const value = await redis.get(KEY(token));
    if (value) {
      // Single-use: delete on read so the token can't be replayed.
      await redis.del(KEY(token));
    }
    return value;
  } catch (error) {
    logRedisUnavailableOnce('Redis GET oauth-handoff failed', error);
    return null;
  }
}
