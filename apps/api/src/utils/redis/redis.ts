import { Redis } from 'ioredis';
import { env } from '@api/config/env';

export const redis = new Redis(env.REDIS_URL);
