/**
 * Mirrors `apps/tenant-router` path splitting for BYOD custom domains.
 *
 * Approximated forwards customer domains straight to the dashboard Render
 * service, so `/proxy/*` and `/api/auth/*` never reach the API unless we
 * forward them here. Tenant subdomains on `*.myclassroomio.com` hit the
 * Cloudflare Worker first and normally never exercise this path.
 */

const PROXY_PREFIX = '/proxy';
const AUTH_PREFIX = '/api/auth';

export function shouldForwardToApi(pathname: string): boolean {
  return (
    pathname === PROXY_PREFIX ||
    pathname.startsWith(`${PROXY_PREFIX}/`) ||
    pathname === AUTH_PREFIX ||
    pathname.startsWith(`${AUTH_PREFIX}/`)
  );
}

function resolveApiUpstreamPath(pathname: string): string {
  if (pathname === PROXY_PREFIX || pathname.startsWith(`${PROXY_PREFIX}/`)) {
    return pathname.slice(PROXY_PREFIX.length) || '/';
  }

  return pathname;
}

function resolveApiUpstreamBase(): string | null {
  const base = process.env.PRIVATE_SERVER_URL;
  if (!base) return null;

  return base.replace(/\/$/, '');
}

function resolveOriginalHost(request: Request, url: URL): string {
  return request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
}

export async function proxyRequestToApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const apiBase = resolveApiUpstreamBase();

  if (!apiBase) {
    console.error('proxyRequestToApi: missing PRIVATE_SERVER_URL');
    return new Response('API upstream not configured', { status: 502 });
  }

  const upstreamPath = resolveApiUpstreamPath(url.pathname);
  const upstreamUrl = new URL(`${upstreamPath}${url.search}`, apiBase);
  const originalHost = resolveOriginalHost(request, url);

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('host', upstreamUrl.host);
  upstreamHeaders.set('x-forwarded-host', originalHost);
  upstreamHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const forwardedFor = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    upstreamHeaders.set('x-forwarded-for', forwardedFor);
  }

  const init: RequestInit = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  return fetch(upstreamUrl, init);
}
