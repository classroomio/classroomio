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
 * The remote MCP endpoint: bearer-token only, so any origin may call it. Browser-based MCP clients
 * need the protocol headers allowed and `WWW-Authenticate` exposed to start the OAuth flow.
 */
export const mcpCors = cors({
  origin: '*',
  credentials: false,
  allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Protocol-Version', 'Mcp-Session-Id', 'Last-Event-ID'],
  exposeHeaders: ['WWW-Authenticate', 'Mcp-Session-Id', 'Mcp-Protocol-Version'],
  maxAge: 600
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
 * - `/.well-known/` and the OAuth token, register, revoke and JWKS endpoints: called by third-party clients with no cookies.
 *
 * Requests under these prefixes use `publicApiCors` and skip the Better Auth session lookup.
 */
export const PUBLIC_CORS_PATH_PREFIXES = ['/public-api/', '/widgets/', '/.well-known/'] as const;

export const PUBLIC_OAUTH_PATHS = [
  '/api/auth/oauth2/token',
  '/api/auth/oauth2/register',
  '/api/auth/oauth2/revoke',
  '/api/auth/jwks'
] as const;

export function isMcpPath(path: string): boolean {
  return path === '/mcp' || path.startsWith('/mcp/');
}

export function isPublicOAuthPath(path: string): boolean {
  return path.startsWith('/.well-known/') || PUBLIC_OAUTH_PATHS.some((oauthPath) => path === oauthPath);
}

export function isPublicCorsPath(path: string): boolean {
  return (
    PUBLIC_CORS_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)) || isPublicOAuthPath(path) || isMcpPath(path)
  );
}
