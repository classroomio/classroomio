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

/**
 * Path prefixes that must accept requests from any third-party origin (no cookies):
 *
 * - `/public-api/`: Bearer-token REST API (automation keys).
 * - `/widgets/`: Anonymous payload endpoint hit by the course-widget embed script on customer sites.
 *
 * Requests under these prefixes use `publicApiCors` and skip the Better Auth session lookup.
 */
export const PUBLIC_CORS_PATH_PREFIXES = ['/public-api/', '/widgets/'] as const;

export function isPublicCorsPath(path: string): boolean {
  return PUBLIC_CORS_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
