import * as z from 'zod';

const envSchema = z.object({
  // Legacy Cloudflare R2 config (used when OBJECT_STORAGE_* vars are absent)
  CLOUDFLARE_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_BUCKET_DOMAIN: z.string().optional(),
  CLOUDFLARE_RENDERING_API_KEY: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_IMAGE_BUCKET_DOMAIN: z.string().optional(),
  APPROXIMATED_API_KEY: z.string().optional(),
  APPROXIMATED_TARGET_ADDRESS: z.string().optional(),
  /** Public IP customers point their A record to (Approximated edge IP). */
  APPROXIMATED_DNS_TARGET_IP: z.string().optional(),
  /** Optional CNAME target customers can point to instead of A record. */
  APPROXIMATED_DNS_TARGET_CNAME: z.string().optional(),
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
  PUBLIC_EMBED_BASE_URL: z.string().optional(),
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
  /** Dashboard origin for invite/email links (e.g. https://app.yourdomain.com). When set, all email links point here instead of app.classroomio.com. Required for self-hosted. */
  DASHBOARD_ORIGIN: z.string().optional(),
  /**
   * Shared password for the /admin/queues HTTP Basic Auth prompt. When set, the
   * dashboard mounts in production and challenges with `WWW-Authenticate: Basic`,
   * accepting any username with this password — keeps the secret out of the
   * URL/history. Leave unset to keep the dashboard hidden outside dev.
   */
  QUEUE_DASHBOARD_PASSWORD: z.string().optional(),
  /** Optional Bearer token for Jina Reader (higher rate limits). */
  JINA_API_KEY: z.string().optional(),
  /** Max completed fetch_documentation_url calls per agent conversation (default 15). */
  AGENT_MAX_FETCHES_PER_CONVERSATION: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') {
        return 15;
      }

      const parsed = Number(v);

      return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 15;
    }),
  /** Sentry error tracking (server-side). Leave SENTRY_DSN unset to disable. */
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  /** Max fetch_documentation_url calls per org per UTC day (default 500). */
  AGENT_MAX_FETCHES_PER_ORG_PER_DAY: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') {
        return 500;
      }

      const parsed = Number(v);

      return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 500;
    })
});

export const env = envSchema.parse(process.env);
