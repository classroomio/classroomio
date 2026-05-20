/**
 * @cio/tenant-router — Cloudflare Worker that fronts every browser-facing host.
 *
 * Routes (see wrangler.toml):
 *   - *.classroomio.school/*        — free-tier tenant sites (acme.classroomio.school)
 *   - classroomio.school/*          — apex (301 → classroomio.com)
 *   - app.classroomio.com/*         — admin dashboard
 *   - <BYOD>/*                      — customer-owned domains via Cloudflare for SaaS
 *
 * Per request, the Worker decides upstream by path:
 *   - /proxy/*  → API service (strips the /proxy prefix, forwards the rest)
 *   - else      → Dashboard service
 *
 * The `/proxy` prefix is the same-origin escape hatch used by the
 * dashboard's browser code so its auth cookies stay host-only while still
 * reaching the API. Any path after `/proxy` is the real API path on the
 * Hono server — e.g. `/proxy/api/auth/sign-in/email` strips to
 * `/api/auth/sign-in/email`, which is where Better Auth is mounted.
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const originalHost = request.headers.get('host') ?? url.host;

    // Apex on classroomio.school → permanent redirect to marketing apex.
    if (originalHost === 'classroomio.school') {
      const target = new URL(env.APEX_REDIRECT_TARGET);
      target.pathname = url.pathname;
      target.search = url.search;
      return Response.redirect(target.toString(), 301);
    }

    const isApiCall = url.pathname === PROXY_PREFIX || url.pathname.startsWith(`${PROXY_PREFIX}/`);
    const upstreamHost = isApiCall ? env.API_UPSTREAM_HOST : env.DASHBOARD_UPSTREAM_HOST;
    const upstreamPath = isApiCall ? url.pathname.slice(PROXY_PREFIX.length) || '/' : url.pathname;

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

    return fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      redirect: 'manual'
    });
  }
} satisfies ExportedHandler<Env>;
