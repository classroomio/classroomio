import { createHmac, timingSafeEqual } from 'node:crypto';

const URL_TTL_SECONDS = 6 * 60 * 60;
const URL_ROUNDING_SECONDS = 60 * 60;

export const HTML_CONTENT_PATH_PREFIX = '/usercontent/html/';

const DEVELOPMENT_SECRET = 'classroomio-local-html-content';

function getSigningSecret(): string | null {
  const secret =
    process.env.HTML_CONTENT_SIGNING_SECRET || process.env.HLS_SIGNING_SECRET || process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;

  return process.env.NODE_ENV === 'production' ? null : DEVELOPMENT_SECRET;
}

function sign(secret: string, assetId: string, expiresAt: number): string {
  return createHmac('sha256', secret).update(`html-content:${assetId}:${expiresAt}`).digest('base64url');
}

/**
 * The origin HTML pages are served from: `HTML_CONTENT_ORIGIN` (a separate registrable domain in production),
 * else the API's own public URL.
 */
export function getHtmlContentOrigin(): string {
  const origin = process.env.HTML_CONTENT_ORIGIN || process.env.PUBLIC_SERVER_URL || '';

  return origin.replace(/\/+$/, '');
}

/**
 * Whether `host` may serve HTML pages. With `HTML_CONTENT_ORIGIN` set, only that host does, so the API's own
 * domain never serves user HTML.
 */
export function isHtmlContentHost(host: string | undefined): boolean {
  const contentOrigin = process.env.HTML_CONTENT_ORIGIN;
  if (!contentOrigin) return true;

  return !!host && new URL(contentOrigin).host === host;
}

/**
 * True when `host` is the dedicated HTML content host, which serves HTML pages and nothing else. A content origin
 * on the API's own host is not dedicated, so the API keeps serving its routes there.
 */
export function isDedicatedHtmlContentHost(host: string | undefined): boolean {
  const contentOrigin = process.env.HTML_CONTENT_ORIGIN;
  const serverUrl = process.env.PUBLIC_SERVER_URL;
  if (!contentOrigin) return false;
  if (serverUrl && new URL(serverUrl).host === new URL(contentOrigin).host) return false;

  return isHtmlContentHost(host);
}

/**
 * A time-limited URL for one HTML page asset. Expiry is rounded up to the hour so the URL, and the browser's
 * cached copy, stay stable across reloads.
 * @returns null when no signing secret is configured.
 */
export function signHtmlContentUrl(assetId: string, now = Date.now()): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;

  const nowSeconds = Math.floor(now / 1000);
  const expiresAt = Math.ceil((nowSeconds + URL_TTL_SECONDS) / URL_ROUNDING_SECONDS) * URL_ROUNDING_SECONDS;
  const signature = sign(secret, assetId, expiresAt);

  return `${getHtmlContentOrigin()}${HTML_CONTENT_PATH_PREFIX}${assetId}?exp=${expiresAt}&sig=${signature}`;
}

/**
 * Checks a signed HTML page URL's expiry and signature for `assetId`.
 */
export function verifyHtmlContentSignature(assetId: string, expiresAt: number, signature: string, now = Date.now()) {
  const secret = getSigningSecret();
  if (!secret || expiresAt * 1000 < now) return false;

  const expected = Buffer.from(sign(secret, assetId, expiresAt));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
