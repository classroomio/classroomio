import { createClient, type RedisClientType } from 'redis';
import { env } from '../../config/env';

/**
 * General-purpose Redis client (rate limiting, cache, OAuth handoff).
 *
 * Configured for Redis Cloud maintenance / failover resilience:
 * - automatic reconnect with exponential backoff + jitter
 * - error listeners so socket drops never crash the process
 * - fresh DNS on each reconnect (node-redis default)
 *
 * See https://redis.io/docs/latest/operate/rc/resilient-apps/
 * and https://redis.io/docs/latest/develop/clients/nodejs/connect/
 */
const client: RedisClientType = createClient({
  url: env.REDIS_URL,
  socket: {
    // Keep retrying through Redis Cloud maintenance windows; never return false.
    reconnectStrategy(retries) {
      const jitter = Math.floor(Math.random() * 100);
      const delay = Math.min(2 ** retries * 50, 3000);

      return delay + jitter;
    },
    keepAlive: 10_000,
    connectTimeout: 10_000
  }
});

let hasLoggedRedisUnavailable = false;
let isConnected = false;

export function logRedisUnavailableOnce(message: string, error?: unknown): void {
  if (hasLoggedRedisUnavailable) {
    return;
  }

  hasLoggedRedisUnavailable = true;

  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}

function isTransientRedisSocketError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';

  return (
    code === 'ECONNABORTED' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    /READONLY|LOADING|Connection is closed|Socket closed unexpectedly/i.test(message)
  );
}

// Handle connection events
client.on('error', (err) => {
  if (isTransientRedisSocketError(err)) {
    // Expected during Redis Cloud maintenance — client reconnects automatically.
    console.warn('Redis socket error (reconnecting):', err);
    return;
  }

  logRedisUnavailableOnce('Redis unavailable, Redis-backed features disabled', err);
});

client.on('reconnecting', () => {
  console.warn('Redis client reconnecting');
});

client.on('connect', () => {
  console.log('Redis Client Connected');
});

client.on('ready', () => {
  console.log('Redis Client Ready');
  isConnected = true;
});

client.on('end', () => {
  isConnected = false;
});

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    logRedisUnavailableOnce('REDIS_URL not set, Redis features disabled');
    return;
  }
  if (isConnected || client.isOpen) return;
  try {
    await client.connect();
    isConnected = true;
  } catch (error) {
    logRedisUnavailableOnce('Redis connection failed, API will run without Redis', error);
    // Don't throw - allow API to start; rate limiting and caching will degrade gracefully
  }
}

// Export the client (connection will be established before server starts)
export const redis: RedisClientType = client;

// Export type for use in other files
export type RedisClient = RedisClientType;
