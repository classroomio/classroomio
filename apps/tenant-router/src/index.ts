/**
 * @cio/tenant-router — Cloudflare Worker that fronts every browser-facing host.
 *
 * Routes (see wrangler.toml):
 *   - *.myclassroomio.com/*         — free-tier tenant sites (acme.myclassroomio.com)
 *   - myclassroomio.com/*           — apex (301 → classroomio.com)
 *   - app.classroomio.com/*         — admin dashboard
 *   - <BYOD>/*                      — customer-owned domains via Cloudflare for SaaS
 *
 * Per request, the Worker decides upstream by path:
 *   - /proxy/*       → API service (strips the /proxy prefix, forwards the rest)
 *   - /api/auth/*    → API service (forwarded as-is, no prefix strip)
 *   - else           → Dashboard service
 *
 * The `/proxy` prefix is the same-origin escape hatch used by the
 * dashboard's browser code so its auth cookies stay host-only while still
 * reaching the API. Any path after `/proxy` is the real API path on the
 * Hono server — e.g. `/proxy/api/auth/sign-in/email` strips to
 * `/api/auth/sign-in/email`, which is where Better Auth is mounted.
 *
 * `/api/auth/*` is forwarded directly because Better Auth's oAuthProxy
 * plugin generates absolute redirect URLs like
 * `<tenant>/api/auth/oauth-proxy-callback?...` (no /proxy prefix — the
 * plugin only knows Better Auth's basePath, not our Worker convention).
 * The dashboard has its own SvelteKit routes under `/api/*` (e.g.
 * `/api/polar/*`) so we narrow the auth carve-out to `/api/auth/*` only.
 *
 * The Worker preserves the original Host as X-Forwarded-Host so the
 * dashboard (SvelteKit adapter-node `HOST_HEADER`) and Better Auth see the
 * host the browser actually called. Auth cookies are emitted without a
 * Domain attribute upstream, so they scope host-only on every domain.
 */

interface Env {
  DASHBOARD_UPSTREAM_HOST: string;
  API_UPSTREAM_HOST: string;
  APEX_REDIRECT_TARGET: string;
}

const PROXY_PREFIX = '/proxy';
const AUTH_PREFIX = '/api/auth';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const originalHost = request.headers.get('host') ?? url.host;

    // Apex on myclassroomio.com → permanent redirect to marketing apex.
    if (originalHost === 'myclassroomio.com') {
      const target = new URL(env.APEX_REDIRECT_TARGET);
      target.pathname = url.pathname;
      target.search = url.search;
      return Response.redirect(target.toString(), 301);
    }

    const isProxiedApiCall = url.pathname === PROXY_PREFIX || url.pathname.startsWith(`${PROXY_PREFIX}/`);
    const isDirectAuthCall = url.pathname === AUTH_PREFIX || url.pathname.startsWith(`${AUTH_PREFIX}/`);
    const isApiCall = isProxiedApiCall || isDirectAuthCall;

    const upstreamHost = isApiCall ? env.API_UPSTREAM_HOST : env.DASHBOARD_UPSTREAM_HOST;
    const upstreamPath = isProxiedApiCall ? url.pathname.slice(PROXY_PREFIX.length) || '/' : url.pathname;

    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = 'https:';
    upstreamUrl.host = upstreamHost;
    upstreamUrl.pathname = upstreamPath;

    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set('host', upstreamHost);
    upstreamHeaders.set('x-forwarded-host', originalHost);
    upstreamHeaders.set('x-forwarded-proto', 'https');

    const clientIp = request.headers.get('cf-connecting-ip');
    if (clientIp) {
      upstreamHeaders.set('x-forwarded-for', clientIp);
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      redirect: 'manual'
    });

    if (isProxiedApiCall && upstreamResponse.status >= 400) {
      console.log(
        `[proxy] ${request.method} ${url.pathname} → ${upstreamHost}${upstreamPath} status=${upstreamResponse.status} ct=${request.headers.get('content-type') ?? ''} upstream-cf-ray=${upstreamResponse.headers.get('cf-ray') ?? 'none'} upstream-server=${upstreamResponse.headers.get('server') ?? 'none'}`
      );
    }

    return upstreamResponse;
  }
} satisfies ExportedHandler<Env>;
