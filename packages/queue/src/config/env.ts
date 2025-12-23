import * as z from 'zod';

const envSchema = z.object({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().optional(),
  QUEUE_CONCURRENCY: z.coerce.number().optional(),
  TASKFORCE_TOKEN: z.string().optional(),
  TASKFORCE_CONNECTION_NAME: z.string().optional(),
  TASKFORCE_TEAM: z.string().optional(),
  TASKFORCE_QUEUES: z.string().optional(), 

});

export const queueEnv = envSchema.parse(process.env);


