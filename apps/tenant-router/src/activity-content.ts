export interface ActivityContentClaims {
  org: string;
  p: string;
  anc: string[];
  wk: number;
}

export interface ActivityContentEnv {
  SCORM_BUCKET: R2Bucket;
  ACTIVITY_SIGNING_SECRET: string;
  SCORM_CONTENT_DOMAIN?: string;
  API_UPSTREAM_HOST: string;
}

export const ACTIVITY_CONTENT_PREFIX = '/activity/content/';
export const ACTIVITY_CONTENT_DOMAIN_DEFAULT = 'classroomio-content.com';
export const ACTIVITY_CACHE_CONTROL = 'public, max-age=604800, immutable';
export const ACTIVITY_CACHE_FILE_LIMIT_BYTES = 512 * 1024 * 1024;

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  xhtml: 'application/xhtml+xml; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  vtt: 'text/vtt; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
  zip: 'application/zip',
  swf: 'application/x-shockwave-flash',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject'
};

export class ActivityContentHttpError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 405 | 416;
  readonly responseHeaders?: Headers;

  constructor(status: 400 | 401 | 403 | 404 | 405 | 416, message: string, responseHeaders?: Headers) {
    super(message);
    this.name = 'ActivityContentHttpError';
    this.status = status;
    this.responseHeaders = responseHeaders;
  }
}

export function contentTypeForActivityFile(fileName: string): string {
  const dot = fileName.lastIndexOf('.');

  if (dot === -1) return 'application/octet-stream';

  const extension = fileName.slice(dot + 1).toLowerCase();

  return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

export function hostnameFromHost(hostHeader: string): string {
  const withoutPort = hostHeader.split(':')[0] ?? hostHeader;

  return withoutPort.trim().toLowerCase();
}

export function contentDomainOf(env: { SCORM_CONTENT_DOMAIN?: string }): string {
  const configured = env.SCORM_CONTENT_DOMAIN?.trim().toLowerCase();

  if (configured) return configured;

  return ACTIVITY_CONTENT_DOMAIN_DEFAULT;
}

export function isContentHost(hostname: string, contentDomain: string): boolean {
  return hostname.length > contentDomain.length + 1 && hostname.endsWith(`.${contentDomain}`);
}

export function orgKeyFromContentHost(hostname: string, contentDomain: string): string | null {
  if (!isContentHost(hostname, contentDomain)) return null;

  return hostname.slice(0, hostname.length - contentDomain.length - 1);
}

export function isActivityContentPath(pathname: string): boolean {
  return pathname === '/activity/content' || pathname.startsWith(ACTIVITY_CONTENT_PREFIX);
}

export function isActivityPlayerOrRuntimePath(pathname: string): boolean {
  if (pathname === '/activity/player' || pathname.startsWith('/activity/player/')) return true;

  if (pathname === '/activity/player-assets' || pathname.startsWith('/activity/player-assets/')) return true;

  return pathname.startsWith('/activity/scorm/runtime/');
}

/**
 * Normalizes a content-relative path for prefix checks. Returns null when unsafe.
 */
export function normalizeActivityContentPath(rawPath: string): string | null {
  let decoded: string;

  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  const forward = decoded.replace(/\\/g, '/');
  const normalized = forward.normalize('NFC');

  if (normalized.startsWith('/')) return null;

  if (/^[a-zA-Z]:(\/|$)/.test(normalized)) return null;

  const segments = normalized.split('/').filter((segment) => segment !== '' && segment !== '.');

  if (segments.length === 0) return null;

  if (segments.some((segment) => segment === '..')) return null;

  return segments.join('/');
}

/**
 * Monday-anchored ISO week index. Consecutive weeks differ by exactly one.
 */
export function isoWeekIndex(date: Date): number {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7;

  day.setUTCDate(day.getUTCDate() - weekday + 3);

  return Math.floor(day.getTime() / (7 * 24 * 60 * 60 * 1000));
}

function base64UrlToBytes(segment: string): Uint8Array {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function timingSafeEqualBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

function isSafePackagePrefix(prefix: unknown): prefix is string {
  if (typeof prefix !== 'string' || prefix.length === 0) return false;

  if (prefix.startsWith('/') || prefix.includes('\\')) return false;

  if (prefix.split('/').some((segment) => segment === '..')) return false;

  return true;
}

function sanitizeAllowedAncestors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const allowed = value.filter(
    (entry): entry is string => typeof entry === 'string' && /^https?:\/\/[^\s;]+$/.test(entry)
  );

  return [...new Set(allowed)].sort();
}

/**
 * Verifies a content token against its organization. Throws 401 on a forged,
 * malformed or expired token and 403 when the token names another organization.
 */
export async function verifyActivityContentToken(
  token: string,
  secret: string,
  expectedOrg: string,
  nowMs: number = Date.now()
): Promise<ActivityContentClaims> {
  const parts = token.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  const body = parts[0];
  const signature = parts[1];
  let payloadBytes: Uint8Array;
  let signatureBytes: Uint8Array;

  try {
    payloadBytes = base64UrlToBytes(body);
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));

  if (!timingSafeEqualBytes(signatureBytes, expectedBytes)) {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  let claims: { org?: unknown; p?: unknown; anc?: unknown; wk?: unknown };

  try {
    claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      org?: unknown;
      p?: unknown;
      anc?: unknown;
      wk?: unknown;
    };
  } catch {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  if (typeof claims.org !== 'string' || claims.org.length === 0 || !isSafePackagePrefix(claims.p)) {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  if (claims.org !== expectedOrg) {
    throw new ActivityContentHttpError(403, 'Forbidden');
  }

  if (!Number.isInteger(claims.wk)) {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  const tokenWeek = claims.wk as number;
  const age = isoWeekIndex(new Date(nowMs)) - tokenWeek;

  if (age < 0 || age > 1) {
    throw new ActivityContentHttpError(401, 'Unauthorized');
  }

  const prefix = claims.p as string;
  const ancestors = sanitizeAllowedAncestors(claims.anc);

  return { org: claims.org, p: prefix, anc: ancestors, wk: tokenWeek };
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const bytes = new Uint8Array(digest);

  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildActivityCacheKey(host: string, objectKey: string, ancestorsHash: string): Request {
  return new Request(`https://${host}/activity/content/${objectKey}?anc=${ancestorsHash}`, { method: 'GET' });
}

export function findActivityCaseInsensitiveMatch(target: string, names: string[]): string | null {
  if (names.includes(target)) return target;

  const lowered = target.toLowerCase();
  const match = names.find((name) => name.toLowerCase() === lowered);

  return match ?? null;
}

export function activityIndexKeys(prefix: string): [string, string] {
  return [`${prefix}/index.json`, `${prefix}.index.json`];
}

export function activityContentHeaders(contentType: string, ancestors: string[]): Headers {
  const headers = new Headers();

  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', ACTIVITY_CACHE_CONTROL);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Security-Policy', `frame-ancestors 'self'${ancestors.map((origin) => ` ${origin}`).join('')}`);
  headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  headers.set('Referrer-Policy', 'strict-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  return headers;
}

async function readIndexListing(bucket: R2Bucket, prefix: string): Promise<string[] | null> {
  const candidates = activityIndexKeys(prefix);

  for (const indexKey of candidates) {
    const indexObject = await bucket.get(indexKey);

    if (!indexObject) continue;

    let parsed: unknown;

    try {
      parsed = await indexObject.json();
    } catch {
      continue;
    }

    const names = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { files?: unknown }).files)
        ? (parsed as { files: unknown[] }).files
        : null;

    if (!names) continue;

    const relativeNames = names.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

    return relativeNames;
  }

  return null;
}

async function resolveActivityObjectKey(
  bucket: R2Bucket,
  prefix: string,
  normalizedPath: string
): Promise<string | null> {
  const exactKey = `${prefix}/${normalizedPath}`;
  const exactHead = await bucket.head(exactKey);

  if (exactHead) return exactKey;

  const listing = await readIndexListing(bucket, prefix);

  if (!listing) return null;

  const match = findActivityCaseInsensitiveMatch(normalizedPath, listing);

  if (!match) return null;

  if (match.startsWith(`${prefix}/`)) return match;

  const normalizedMatch = normalizeActivityContentPath(match);

  if (!normalizedMatch) return null;

  return `${prefix}/${normalizedMatch}`;
}

function contentTypeForStoredObject(objectKey: string, httpMetadata?: { contentType?: string }): string {
  const stored = httpMetadata?.contentType;

  if (stored && stored.length > 0) return stored;

  return contentTypeForActivityFile(objectKey);
}

interface ParsedActivityContentUrl {
  token: string;
  relativePath: string;
}

function parseActivityContentUrl(pathname: string): ParsedActivityContentUrl | null {
  if (!pathname.startsWith(ACTIVITY_CONTENT_PREFIX)) return null;

  const tail = pathname.slice(ACTIVITY_CONTENT_PREFIX.length);
  const slash = tail.indexOf('/');

  if (slash === -1) return null;

  const encodedToken = tail.slice(0, slash);
  const encodedPath = tail.slice(slash + 1);

  let token: string;

  try {
    token = decodeURIComponent(encodedToken);
  } catch {
    return null;
  }

  if (!token) return null;

  return { token, relativePath: encodedPath };
}

/**
 * Serves one package file from the private bucket with edge caching. Verifies
 * the token before any cache read and caches only full 200 responses.
 */
export async function handleActivityContentRequest(
  request: Request,
  env: ActivityContentEnv,
  nowMs: number = Date.now()
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const requestUrl = new URL(request.url);
  const hostname = hostnameFromHost(request.headers.get('host') ?? requestUrl.host);
  const contentDomain = contentDomainOf(env);

  if (!isContentHost(hostname, contentDomain)) {
    return new Response('Not Found', { status: 404 });
  }

  const expectedOrg = orgKeyFromContentHost(hostname, contentDomain);

  if (!expectedOrg) {
    return new Response('Not Found', { status: 404 });
  }

  const parsed = parseActivityContentUrl(requestUrl.pathname);

  if (!parsed) {
    return new Response('Unauthorized', { status: 401 });
  }

  let claims: ActivityContentClaims;

  try {
    claims = await verifyActivityContentToken(parsed.token, env.ACTIVITY_SIGNING_SECRET, expectedOrg, nowMs);
  } catch (error) {
    if (error instanceof ActivityContentHttpError) {
      return new Response(error.status === 403 ? 'Forbidden' : 'Unauthorized', { status: error.status });
    }

    throw error;
  }

  let normalizedPath: string | null;

  try {
    normalizedPath = normalizeActivityContentPath(decodeURIComponent(parsed.relativePath));
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (!normalizedPath) {
    return new Response('Bad Request', { status: 400 });
  }

  const objectKey = `${claims.p}/${normalizedPath}`;
  const ancestorsFingerprint = await sha256Hex(JSON.stringify([...claims.anc].sort()));
  const rangeHeader = request.headers.get('range');

  if (request.method === 'GET' && !rangeHeader) {
    const cacheKey = buildActivityCacheKey(hostname, objectKey, ancestorsFingerprint);
    const cached = await caches.default.match(cacheKey);

    if (cached) return cached;
  }

  if (request.method === 'HEAD') {
    const resolvedKey = await resolveActivityObjectKey(env.SCORM_BUCKET, claims.p, normalizedPath);

    if (!resolvedKey) {
      return new Response('Not Found', { status: 404 });
    }

    const head = await env.SCORM_BUCKET.head(resolvedKey);

    if (!head) {
      return new Response('Not Found', { status: 404 });
    }

    const headHeaders = activityContentHeaders(contentTypeForStoredObject(resolvedKey, head.httpMetadata), claims.anc);

    if (head.size != null) headHeaders.set('Content-Length', String(head.size));

    return new Response(null, { status: 200, headers: headHeaders });
  }

  if (rangeHeader) {
    const resolvedKey = await resolveActivityObjectKey(env.SCORM_BUCKET, claims.p, normalizedPath);

    if (!resolvedKey) {
      return new Response('Not Found', { status: 404 });
    }

    const head = await env.SCORM_BUCKET.head(resolvedKey);

    if (!head || head.size == null) {
      return new Response('Not Found', { status: 404 });
    }

    const size = head.size;
    const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

    if (!rangeMatch) {
      const invalidHeaders = activityContentHeaders(
        contentTypeForStoredObject(resolvedKey, head.httpMetadata),
        claims.anc
      );
      invalidHeaders.set('Content-Range', `bytes */${size}`);

      return new Response('Range Not Satisfiable', { status: 416, headers: invalidHeaders });
    }

    const first = rangeMatch[1] ?? '';
    const last = rangeMatch[2] ?? '';
    let start: number;
    let end: number;

    if (first === '' && last === '') {
      const invalidHeaders = activityContentHeaders(
        contentTypeForStoredObject(resolvedKey, head.httpMetadata),
        claims.anc
      );
      invalidHeaders.set('Content-Range', `bytes */${size}`);

      return new Response('Range Not Satisfiable', { status: 416, headers: invalidHeaders });
    }

    if (first === '') {
      const suffixLength = Number(last);
      if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
        const invalidHeaders = activityContentHeaders(
          contentTypeForStoredObject(resolvedKey, head.httpMetadata),
          claims.anc
        );
        invalidHeaders.set('Content-Range', `bytes */${size}`);

        return new Response('Range Not Satisfiable', { status: 416, headers: invalidHeaders });
      }
      start = Math.max(size - suffixLength, 0);
      end = size - 1;
    } else {
      start = Number(first);
      end = last === '' ? size - 1 : Number(last);
    }

    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= size) {
      const invalidHeaders = activityContentHeaders(
        contentTypeForStoredObject(resolvedKey, head.httpMetadata),
        claims.anc
      );
      invalidHeaders.set('Content-Range', `bytes */${size}`);

      return new Response('Range Not Satisfiable', { status: 416, headers: invalidHeaders });
    }

    const clampedEnd = Math.min(end, size - 1);
    const rangedObject = await env.SCORM_BUCKET.get(resolvedKey, {
      range: { offset: start, length: clampedEnd - start + 1 }
    });

    if (!rangedObject) {
      return new Response('Not Found', { status: 404 });
    }

    const rangeHeaders = activityContentHeaders(
      contentTypeForStoredObject(resolvedKey, rangedObject.httpMetadata),
      claims.anc
    );
    rangeHeaders.set('Content-Range', `bytes ${start}-${clampedEnd}/${size}`);
    rangeHeaders.set('Content-Length', String(clampedEnd - start + 1));

    return new Response(rangedObject.body, { status: 206, headers: rangeHeaders });
  }

  const storedObject = await env.SCORM_BUCKET.get(objectKey);
  let resolvedKey = objectKey;
  let bodyObject: R2ObjectBody | null = storedObject;

  if (!bodyObject) {
    const listing = await readIndexListing(env.SCORM_BUCKET, claims.p);

    if (!listing) {
      return new Response('Not Found', { status: 404 });
    }

    const match = findActivityCaseInsensitiveMatch(normalizedPath, listing);

    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    if (match.startsWith(`${claims.p}/`)) {
      resolvedKey = match;
    } else {
      const normalizedMatch = normalizeActivityContentPath(match);

      if (!normalizedMatch) {
        return new Response('Not Found', { status: 404 });
      }

      resolvedKey = `${claims.p}/${normalizedMatch}`;
    }

    bodyObject = await env.SCORM_BUCKET.get(resolvedKey);

    if (!bodyObject) {
      return new Response('Not Found', { status: 404 });
    }
  }

  const responseHeaders = activityContentHeaders(
    contentTypeForStoredObject(resolvedKey, bodyObject.httpMetadata),
    claims.anc
  );

  if (bodyObject.size != null) responseHeaders.set('Content-Length', String(bodyObject.size));

  const response = new Response(bodyObject.body, { status: 200, headers: responseHeaders });

  // Cloudflare only caches files up to 512 MB on most plans; larger objects bypass the edge cache.
  const cacheableSize = bodyObject.size ?? 0;
  const withinCacheLimit = bodyObject.size == null || cacheableSize <= ACTIVITY_CACHE_FILE_LIMIT_BYTES;

  if (withinCacheLimit) {
    const cacheKey = buildActivityCacheKey(hostname, objectKey, ancestorsFingerprint);
    await caches.default.put(cacheKey, response.clone());
  }

  return response;
}

/**
 * Forwards player and run-time traffic on the content host to the API upstream.
 */
export async function forwardActivityToApiUpstream(
  request: Request,
  env: { API_UPSTREAM_HOST: string },
  originalHost: string
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(request.url);

  upstreamUrl.protocol = 'https:';
  upstreamUrl.host = env.API_UPSTREAM_HOST;
  upstreamUrl.pathname = requestUrl.pathname;
  upstreamUrl.search = requestUrl.search;

  const upstreamHeaders = new Headers(request.headers);

  upstreamHeaders.set('host', env.API_UPSTREAM_HOST);
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
