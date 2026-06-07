import * as z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required for the BullMQ worker'),
  DATABASE_URL: z.string().optional(),
  PRIVATE_DATABASE_URL: z.string().optional(),

  /** Object storage (mirrors apps/api/src/config/env). Workers stream object bytes. */
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().optional(),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_FORCE_PATH_STYLE: z.string().optional(),
  OBJECT_STORAGE_BUCKET_VIDEOS: z.string().optional(),
  OBJECT_STORAGE_BUCKET_DOCUMENTS: z.string().optional(),
  OBJECT_STORAGE_BUCKET_MEDIA: z.string().optional(),
  OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL: z.string().optional(),
  OBJECT_STORAGE_PUBLIC_ENDPOINT: z.string().optional(),

  /** Cloudflare R2 fallback. */
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_IMAGE_BUCKET_DOMAIN: z.string().optional(),

  /** Concurrency tuning per worker process. */
  MEDIA_WORKER_CONCURRENCY: z.string().optional(),
  TRANSCRIBE_WORKER_CONCURRENCY: z.string().optional(),
  EMAIL_WORKER_CONCURRENCY: z.string().optional(),
  AGENT_COURSE_GENERATION_WORKER_CONCURRENCY: z.string().optional(),

  /** Optional OpenAI key — when unset, transcribe-audio jobs no-op and OpenAI-backed agent runs fail config checks. */
  OPENAI_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);

/** Worker DB connection string (DATABASE_URL preferred, falls back to PRIVATE_DATABASE_URL). */
export function resolveDatabaseUrl(): string {
  return env.DATABASE_URL ?? env.PRIVATE_DATABASE_URL ?? '';
}
