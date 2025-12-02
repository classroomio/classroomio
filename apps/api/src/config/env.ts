import { z } from 'zod';

const envSchema = z.object({
  CLOUDFLARE_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_BUCKET_DOMAIN: z.string().optional(),
  CLOUDFLARE_RENDERING_API_KEY: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_IMAGE_BUCKET_DOMAIN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAPI_URL: z.string().optional(),
  PORT: z.string().optional(),
  PRIVATE_SUPABASE_SERVICE_ROLE: z.string(),
  PUBLIC_SUPABASE_ANON_KEY: z.string(),
  PUBLIC_SUPABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  SERVER_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SENDER: z.string().optional(),
  SMTP_USER: z.string().optional(),
  ZOHO_TOKEN: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  SERVER_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
