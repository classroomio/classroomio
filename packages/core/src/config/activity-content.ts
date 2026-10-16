import { AppError, ErrorCodes } from '@cio/utils/errors';

import { env } from './env';

/**
 * Content-origin helpers for activity packages (PRD decision 1).
 *
 * Cloud serves package files from `{orgKey}.classroomio-content.com`;
 * self-hosted serves them from one hostname under the operator's domain
 * (`SCORM_CONTENT_ORIGIN`). Tokens are HMAC-signed with
 * `ACTIVITY_SIGNING_SECRET`, shared with the edge worker.
 */

export const ACTIVITY_CONTENT_CACHE_CONTROL = 'public, max-age=604800, immutable';
export const ACTIVITY_PLAYER_HTML_CACHE_CONTROL = 'no-store';
export const ACTIVITY_PLAYER_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const ACTIVITY_CONTENT_PATHS = ['/activity/player', '/activity/player-assets', '/activity/content'];
const ACTIVITY_CONTENT_PATH_PREFIXES = [
  '/activity/player/',
  '/activity/player-assets/',
  '/activity/content/',
  '/activity/scorm/runtime/'
];

/**
 * Stable host label derived from the organization id. Organization ids are
 * UUIDs, which pass through lowercased so the key reverses without a lookup.
 * Never the editable site name.
 */
export function orgContentKey(organizationId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
    return organizationId.toLowerCase();
  }

  throw new AppError('Organization id is not a UUID', ErrorCodes.INTERNAL_ERROR, 500);
}

/**
 * Reverses a content-host key to an organization id. Returns null for
 * malformed keys, which can only arrive from outside minted tokens.
 */
export function orgIdFromContentKey(contentKey: string): string | null {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentKey)) {
    return contentKey.toLowerCase();
  }

  return null;
}

/**
 * Self-hosted content origin. Local dev defaults to the stub port.
 */
export function getScormContentOrigin(): string {
  if (env.SCORM_CONTENT_ORIGIN) return env.SCORM_CONTENT_ORIGIN.replace(/\/$/, '');
  if (env.NODE_ENV === 'development') return 'http://content.localhost:3004';

  throw new AppError('Activity content origin not configured', ErrorCodes.INTERNAL_ERROR, 500);
}

/**
 * Cloud wildcard domain for per-organization content hosts.
 */
export function getScormContentDomain(): string {
  return env.SCORM_CONTENT_DOMAIN ?? 'classroomio-content.com';
}

/**
 * HMAC secret for activity launch and content tokens. Null when unconfigured.
 */
export function getActivitySigningSecret(): string | null {
  return env.ACTIVITY_SIGNING_SECRET ?? null;
}

function stripPort(host: string): string {
  return host.replace(/:\d+$/, '').toLowerCase();
}

/**
 * True when the host is an activity content host: a cloud `{orgKey}` label,
 * the configured self-hosted origin, or a loopback `*.localhost` name in dev.
 */
export function isActivityContentHost(host: string | null): boolean {
  if (!host) return false;

  const hostname = stripPort(host);
  if (!hostname) return false;

  const originHost = (() => {
    try {
      return new URL(getScormContentOrigin()).hostname.toLowerCase();
    } catch {
      return null;
    }
  })();
  if (originHost && hostname === originHost) return true;

  const contentDomain = getScormContentDomain().toLowerCase();
  if (hostname.length > contentDomain.length + 1 && hostname.endsWith(`.${contentDomain}`)) return true;

  if (env.NODE_ENV !== 'production') {
    if (hostname === 'content.localhost' || hostname.endsWith('.content.localhost')) return true;
  }

  return false;
}

/**
 * True for the only paths served on the content host: the player, its
 * assets, package files and the SCORM run-time.
 */
export function isActivityContentPath(pathname: string): boolean {
  if (ACTIVITY_CONTENT_PATHS.includes(pathname)) return true;

  return ACTIVITY_CONTENT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function safeAncestor(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Security headers for content-host responses. Ancestors come from org
 * domains, so only valid http(s) origins reach the header.
 */
export function contentHostHeaders(ancestors: string[]): Record<string, string> {
  const allowed = ancestors.map(safeAncestor).filter((origin): origin is string => origin !== null);
  const unique = [...new Set(allowed)];

  return {
    'Content-Security-Policy': `frame-ancestors 'self'${unique.length > 0 ? ` ${unique.join(' ')}` : ''}`,
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Referrer-Policy': 'strict-origin',
    'X-Content-Type-Options': 'nosniff'
  };
}
