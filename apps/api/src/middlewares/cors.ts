import { cors } from 'hono/cors';
import { resolveTrustedBrowserOriginForCors } from '@api/utils/origins';

const sharedCorsOptions = {
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cio-org-id'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600
};

/**
 * Bearer-token routes meant to be called from any third-party origin (no cookies).
 * `*` is safe here because `credentials` is off — the browser will reject a Set-Cookie roundtrip.
 */
export const publicApiCors = cors({
  ...sharedCorsOptions,
  origin: '*',
  credentials: false
});

/**
 * Cookie/session routes (dashboard RPC, Better Auth, org dashboards).
 * Allowed origins: configured `TRUSTED_ORIGINS`, `*.classroomio.com`, verified custom domains.
 */
export const sessionCors = cors({
  ...sharedCorsOptions,
  origin: (origin) => resolveTrustedBrowserOriginForCors(origin),
  credentials: true
});

/** Path prefix considered "public REST API" for CORS / session bypass. */
export const PUBLIC_API_PATH_PREFIX = '/public-api/';

export function isPublicApiPath(path: string): boolean {
  return path.startsWith(PUBLIC_API_PATH_PREFIX);
}
