import { env } from '@cio/core/config/env';

export * from './rate-limiter';

export const API_PORT = env.PORT ? parseInt(env.PORT) : 3002;
export const API_SERVER_URL = env.PUBLIC_SERVER_URL || `http://localhost:${API_PORT}`;
const configuredTrustedOrigins = env.TRUSTED_ORIGINS
  ? env.TRUSTED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5180', 'https://*.classroomio.com', 'https://*.myclassroomio.com'];

export const TRUSTED_ORIGINS = [
  ...configuredTrustedOrigins.map((origin) => origin.trim()).filter(Boolean),
  ...(env.DASHBOARD_ORIGIN ? [env.DASHBOARD_ORIGIN.trim().replace(/\/$/, '')] : [])
];

const {
  CLOUDFLARE_BUCKET_DOMAIN,
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_RENDERING_API_KEY
} = env;

export const CLOUDFLARE = {
  CONFIGS: {
    BUCKET_DOMAIN: CLOUDFLARE_BUCKET_DOMAIN!,
    ACCESS_KEY: CLOUDFLARE_ACCESS_KEY!,
    RENDERING_API_KEY: CLOUDFLARE_RENDERING_API_KEY!,
    SECRET_ACCESS_KEY: CLOUDFLARE_SECRET_ACCESS_KEY!,
    ACCOUNT_ID: CLOUDFLARE_ACCOUNT_ID!
  },
  R2: {
    BUCKET: 'videos',
    BUCKET_DOMAIN: CLOUDFLARE_ACCOUNT_ID
      ? `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : CLOUDFLARE_BUCKET_DOMAIN!,
    PRESIGN_EXPIRATION_TIME: 60 * 60, // 1 hour
    DOWNLOAD_EXPIRATION_TIME: 60 * 60 // 1 hour
  }
} as const;
