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

/** Hop-by-hop / encoding headers that must not be forwarded after Node fetch decompresses. */
const RESPONSE_HEADERS_TO_STRIP = ['content-encoding', 'content-length', 'transfer-encoding'] as const;

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

function resolveBrowserForwardedHost(request: Request, url: URL): string {
  const raw = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.hostname;
  const [hostname, port = ''] = raw.includes(':') ? raw.split(':', 2) : [raw, ''];

  if (!port) {
    return hostname;
  }

  const privateServerUrl = process.env.PRIVATE_SERVER_URL;
  if (privateServerUrl) {
    try {
      const backendPort = new URL(privateServerUrl).port;
      if (backendPort && port === backendPort) {
        return hostname;
      }
    } catch {
      // Ignore malformed PRIVATE_SERVER_URL.
    }
  }

  return raw;
}

function isStrippedResponseHeader(name: string): boolean {
  return (RESPONSE_HEADERS_TO_STRIP as readonly string[]).includes(name);
}

/**
 * Node's `fetch` always decompresses gzip/br bodies while often leaving
 * `Content-Encoding` on the Response. Returning that Response to the browser
 * (adapter-node) causes `net::ERR_CONTENT_DECODING_FAILED` on auth/proxy calls.
 *
 * Ask the upstream for an identity body and strip encoding length headers so
 * the client receives a plain payload that matches the headers.
 *
 * Set-Cookie must be copied via `getSetCookie()` + `append` — never through
 * `Headers.get('set-cookie')` / a naive `new Headers(upstream.headers)` path
 * that can collapse multiple cookies into one comma-joined value (Expires
 * attributes contain commas, so browsers may drop session/CSRF cookies).
 */
export function buildProxiedApiResponse(upstream: Response): Response {
  const headers = new Headers();

  for (const [name, value] of upstream.headers.entries()) {
    if (name === 'set-cookie' || isStrippedResponseHeader(name)) {
      continue;
    }

    headers.set(name, value);
  }

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [...upstream.headers.entries()].filter(([name]) => name === 'set-cookie').map(([, value]) => value);

  for (const cookie of setCookies) {
    headers.append('set-cookie', cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
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
  const originalHost = resolveBrowserForwardedHost(request, url);

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('host', upstreamUrl.host);
  upstreamHeaders.set('x-forwarded-host', originalHost);
  upstreamHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));
  // Prevent compressed upstream responses: Node decompresses automatically but
  // can leave Content-Encoding set, which breaks the browser.
  upstreamHeaders.set('accept-encoding', 'identity');

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

  const upstreamResponse = await fetch(upstreamUrl, init);

  return buildProxiedApiResponse(upstreamResponse);
}
