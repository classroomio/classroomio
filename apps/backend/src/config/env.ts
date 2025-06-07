import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLOUDFLARE_BUCKET_DOMAIN: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  PUBLIC_SUPABASE_URL: z.string(),
  PUBLIC_SUPABASE_ANON_KEY: z.string(),
  ZOHO_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional()
});

export const env = envSchema.parse(process.env);
