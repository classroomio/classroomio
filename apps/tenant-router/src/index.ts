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
 *   - /api/*  → API service (strips the /api prefix)
 *   - else    → Dashboard service
 *
 * It preserves the original Host as X-Forwarded-Host so the dashboard
 * (SvelteKit adapter-node `HOST_HEADER`) and Better Auth see the host the
 * browser actually called. Auth cookies are emitted without a Domain
 * attribute upstream, so they scope host-only on every domain naturally.
 */

interface Env {
  DASHBOARD_UPSTREAM_HOST: string;
  API_UPSTREAM_HOST: string;
  APEX_REDIRECT_TARGET: string;
}

const API_PREFIX = '/api';

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

    const isApiCall = url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`);
    const upstreamHost = isApiCall ? env.API_UPSTREAM_HOST : env.DASHBOARD_UPSTREAM_HOST;
    const upstreamPath = isApiCall ? url.pathname.slice(API_PREFIX.length) || '/' : url.pathname;

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
