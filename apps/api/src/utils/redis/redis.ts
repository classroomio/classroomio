import { Redis } from 'ioredis';
import { env } from '$src/config/env';

export const redis = new Redis(env.REDIS_URL);
