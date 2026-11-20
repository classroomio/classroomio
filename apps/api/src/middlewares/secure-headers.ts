import type { Context, Next } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

/**
 * `Cross-Origin-Resource-Policy: same-origin` (Hono's default) blocks the
 * dashboard from embedding api-served media (e.g. HLS segments via `<video>`)
 * when the dashboard and api live on different origins in local dev /
 * self-hosted. Every api response is designed for cross-origin consumption, so
 * the right value is `cross-origin`. CORS still gates which origins can read the bytes.
 */
const apiSecureHeaders = secureHeaders({ crossOriginResourcePolicy: 'cross-origin' });

/**
 * OAuth clients such as Zapier open authorization in a popup and read the
 * result through `window.opener`. A `Cross-Origin-Opener-Policy: same-origin`
 * response on any hop of that popup severs the opener, leaving the client on a
 * "close this window" page instead of finishing the connection.
 */
const authSecureHeaders = secureHeaders({ crossOriginResourcePolicy: 'cross-origin', crossOriginOpenerPolicy: false });

function isAuthNavigationPath(path: string): boolean {
  return path === '/api/auth' || path.startsWith('/api/auth/');
}

/** Applies security headers, keeping the window opener intact on Better Auth routes that run inside OAuth popups. */
export function apiSecureHeadersMiddleware(c: Context, next: Next) {
  if (isAuthNavigationPath(c.req.path)) return authSecureHeaders(c, next);

  return apiSecureHeaders(c, next);
}
