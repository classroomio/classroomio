import * as z from 'zod';

const envSchema = z.object({
  // Legacy Cloudflare R2 config (used when OBJECT_STORAGE_* vars are absent)
  CLOUDFLARE_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_BUCKET_DOMAIN: z.string().optional(),
  CLOUDFLARE_RENDERING_API_KEY: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_IMAGE_BUCKET_DOMAIN: z.string().optional(),
  // S3-compatible storage (MinIO, AWS S3, or other S3-compatible backends)
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().optional(),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_FORCE_PATH_STYLE: z.string().optional(),
  OBJECT_STORAGE_BUCKET_VIDEOS: z.string().optional(),
  OBJECT_STORAGE_BUCKET_DOCUMENTS: z.string().optional(),
  OBJECT_STORAGE_BUCKET_MEDIA: z.string().optional(),
  /** Public URL base for media bucket (images, thumbnails). Required for image uploads. */
  OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL: z.string().optional(),
  /** Optional: endpoint for presigned URLs when different from internal (e.g. browser-reachable) */
  OBJECT_STORAGE_PUBLIC_ENDPOINT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAPI_URL: z.string().optional(),
  PORT: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PUBLIC_SERVER_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SENDER: z.string().optional(),
  SMTP_USER: z.string().optional(),
  ZOHO_TOKEN: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  PRIVATE_SERVER_KEY: z.string().optional(),
  PROJECT_ID_VERCEL: z.string().optional(),
  TEAM_ID_VERCEL: z.string().optional(),
  AUTH_BEARER_TOKEN: z.string().optional(),
  UNSPLASH_API_KEY: z.string().optional(),
  /** When 'true', instance runs in self-hosted mode: single org, auto-enroll as student, no org switching */
  PUBLIC_IS_SELFHOSTED: z.string().optional(),
  /** License key for enterprise features (SSO, token-auth, no-tracking, etc.) */
  LICENSE_KEY: z.string().optional(),
  /**
   * External API URL for license verification. Receives POST with { licenseKey } or Authorization: Bearer.
   * Expected response: { valid: boolean, features?: string[], expiresAt?: string }
   */
  LICENSE_VERIFICATION_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
