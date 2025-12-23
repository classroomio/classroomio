import Redis from 'ioredis';
import { queueEnv } from './env';

let redisClient: Redis | null = null;
let redisWorkerClient: Redis | null = null;

export function getRedisConnection(): Redis {
  if (redisClient) {
    return redisClient;
  }

  if (queueEnv.REDIS_URL) {
    redisClient = new Redis(queueEnv.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true
    });
  } else {
    redisClient = new Redis({
      host: queueEnv.REDIS_HOST || 'localhost',
      port: queueEnv.REDIS_PORT || 6379,
      password: queueEnv.REDIS_PASSWORD,
      db: queueEnv.REDIS_DB || 0,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true
    });
  }

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return redisClient;
}

export function getRedisWorkerConnection(): Redis {
  if (redisWorkerClient) {
    return redisWorkerClient;
  }

  // Workers need maxRetriesPerRequest: null for blocking operations
  if (queueEnv.REDIS_URL) {
    redisWorkerClient = new Redis(queueEnv.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
  } else {
    redisWorkerClient = new Redis({
      host: queueEnv.REDIS_HOST || 'localhost',
      port: queueEnv.REDIS_PORT || 6379,
      password: queueEnv.REDIS_PASSWORD,
      db: queueEnv.REDIS_DB || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
  }

  redisWorkerClient.on('error', (err) => {
    console.error('Redis worker connection error:', err);
  });

  return redisWorkerClient;
}

export const redisConnection = getRedisConnection();
export const redisWorkerConnection = getRedisWorkerConnection();
