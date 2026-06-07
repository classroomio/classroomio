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
 *   - /hls/{assetId}/*  → served by the Worker from R2 (no Render hop). The
 *                         path is HMAC-validated against the `cio_hls` cookie
 *                         the API issued. Bytes flow Browser → CF Worker → R2,
 *                         which keeps R2's free-egress story intact for video.
 *   - /proxy/*          → API service (strips the /proxy prefix, forwards the rest)
 *   - /api/auth/*       → API service (forwarded as-is, no prefix strip)
 *   - else              → Dashboard service
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
  /** HMAC-SHA256 secret shared with the API to sign cio_hls tokens. */
  HLS_SIGNING_SECRET: string;
  /** R2 bucket binding for the videos bucket (HLS manifests + segments + audio). */
  VIDEOS_BUCKET: R2Bucket;
}

// PostHog first-party proxy: requests to /ingest/* are forwarded to PostHog EU.
// This makes PostHog cookies first-party (set on the org's domain, not eu.i.posthog.com),
// eliminating the "third-party cookie" Lighthouse Best Practices deduction.
const POSTHOG_INGEST_PREFIX = '/ingest';
const POSTHOG_UPSTREAM = 'eu.i.posthog.com';

const PROXY_PREFIX = '/proxy';
const AUTH_PREFIX = '/api/auth';
const HLS_PREFIX = '/hls/';
const PROXY_HLS_PREFIX = '/proxy/hls/';
const HLS_COOKIE_NAME = 'cio_hls';

const HLS_CONTENT_TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png'
};

function contentTypeFor(path: string): string {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  const ext = path.slice(dot + 1).toLowerCase();
  return HLS_CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((input.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return bytes;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);

  return diff === 0;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));

  return base64UrlEncodeBytes(new Uint8Array(sig));
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const piece of cookieHeader.split(';')) {
    const eq = piece.indexOf('=');
    if (eq === -1) continue;

    const key = piece.slice(0, eq).trim();
    if (key === name) return piece.slice(eq + 1).trim();
  }

  return null;
}

interface VerifiedHlsToken {
  assetId: string;
  expSeconds: number;
}

async function verifyHlsToken(token: string, secret: string): Promise<VerifiedHlsToken | null> {
  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = await hmacSha256Base64Url(secret, payload);
  if (!timingSafeEqual(expected, signature)) return null;

  let decoded: { aid?: string; exp?: number };
  try {
    decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  } catch {
    return null;
  }

  if (typeof decoded.aid !== 'string' || typeof decoded.exp !== 'number') return null;
  if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;

  return { assetId: decoded.aid, expSeconds: decoded.exp };
}

async function handleHlsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(request.url);
  // path is `/hls/{assetId}/...`
  const tail = url.pathname.slice(HLS_PREFIX.length);
  const slash = tail.indexOf('/');
  if (slash === -1) return new Response('Not Found', { status: 404 });

  const assetId = tail.slice(0, slash);
  const relativePath = tail.slice(slash + 1);
  if (!assetId || !relativePath) return new Response('Not Found', { status: 404 });
  if (relativePath.includes('..')) return new Response('Bad Request', { status: 400 });

  const token = readCookie(request.headers.get('cookie'), HLS_COOKIE_NAME);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const verified = await verifyHlsToken(token, env.HLS_SIGNING_SECRET);
  if (!verified) return new Response('Unauthorized', { status: 401 });
  if (verified.assetId !== assetId) return new Response('Forbidden', { status: 403 });

  const objectKey = `${assetId}/${relativePath}`;
  const object =
    request.method === 'HEAD' ? await env.VIDEOS_BUCKET.head(objectKey) : await env.VIDEOS_BUCKET.get(objectKey);

  if (!object) return new Response('Not Found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', contentTypeFor(relativePath));
  // Only `master.m3u8` is mutable — it gets patched when a p1080 rendition is
  // added later, so it stays short-lived. Variant/media playlists and segments
  // are write-once per assetId/path and never change, so cache them immutably.
  const isMutableManifest = relativePath === 'master.m3u8';
  headers.set('Cache-Control', isMutableManifest ? 'private, max-age=10' : 'private, max-age=31536000, immutable');
  if ('writeHttpMetadata' in object) {
    object.writeHttpMetadata(headers);
  }
  if (object.size != null) headers.set('Content-Length', String(object.size));

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  // R2Object#body is a ReadableStream; pass through directly.
  return new Response((object as R2ObjectBody).body, { status: 200, headers });
}

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

    // HLS playback served directly from R2 — Render is never in the bytestream.
    // Accept both `/hls/{assetId}/...` and `/proxy/hls/{assetId}/...` so the
    // dashboard can construct URLs from the same `/proxy`-prefixed API base
    // it uses for every other request — we just strip the prefix here.
    if (url.pathname.startsWith(PROXY_HLS_PREFIX)) {
      url.pathname = url.pathname.slice(PROXY_PREFIX.length);
      return handleHlsRequest(new Request(url, request), env);
    }
    if (url.pathname.startsWith(HLS_PREFIX)) {
      return handleHlsRequest(request, env);
    }

    // PostHog first-party proxy — strip /ingest prefix and forward to PostHog EU.
    if (url.pathname === POSTHOG_INGEST_PREFIX || url.pathname.startsWith(`${POSTHOG_INGEST_PREFIX}/`)) {
      const phUrl = new URL(request.url);
      phUrl.protocol = 'https:';
      phUrl.host = POSTHOG_UPSTREAM;
      phUrl.pathname = url.pathname.slice(POSTHOG_INGEST_PREFIX.length) || '/';
      return fetch(phUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
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

    // SvelteKit's immutable chunk filenames include a content hash, so they
    // are safe to cache forever. Set a long TTL here at the edge so browsers
    // and Cloudflare cache them aggressively rather than revalidating.
    if (url.pathname.startsWith('/_app/immutable/')) {
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return response;
    }

    return upstreamResponse;
  }
} satisfies ExportedHandler<Env>;
