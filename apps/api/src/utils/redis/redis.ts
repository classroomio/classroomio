import { createClient, type RedisClientType } from 'redis';
import { env } from '@api/config/env';

// Create Redis client
const client: RedisClientType = createClient({
  url: env.REDIS_URL
});

// Handle connection events
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Redis Client Connected');
});

client.on('reconnecting', () => {
  console.log('Redis Client Reconnecting');
});

// Track connection state
let isConnected = false;

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    console.warn('REDIS_URL not set, Redis features disabled');
    return;
  }
  if (isConnected) return;
  try {
    await client.connect();
    isConnected = true;
  } catch (error) {
    console.error('Redis connection failed, API will run without Redis:', error);
    // Don't throw - allow API to start; rate limiting and caching will degrade gracefully
  }
}

// Export the client (connection will be established before server starts)
export const redis: RedisClientType = client;

// Export type for use in other files
export type RedisClient = RedisClientType;
