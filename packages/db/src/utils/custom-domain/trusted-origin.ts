import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
import { isLocalOrPrivateHost } from '@cio/utils/functions';
import {
  getVerifiedCustomDomainHostnames,
  isVerifiedCustomDomainHostname
} from '../../queries/organization/organization';

const FIRST_PARTY_ROOTS: readonly string[] = [BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN];

/** Lowercase hostnames with verified custom domains ( warmed at API boot + updated on domain routes ). */
const verifiedCustomDomainHostnames = new Set<string>();

const UNVERIFIED_HOSTNAME_TTL_MS = 60_000;
const UNVERIFIED_HOSTNAME_MAX_ENTRIES = 1_000;

const unverifiedHostnameExpiries = new Map<string, number>();

function isRecentlyUnverified(hostname: string): boolean {
  const expiresAt = unverifiedHostnameExpiries.get(hostname);

  if (expiresAt === undefined) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    unverifiedHostnameExpiries.delete(hostname);
    return false;
  }

  return true;
}

function rememberUnverified(hostname: string): void {
  if (unverifiedHostnameExpiries.size >= UNVERIFIED_HOSTNAME_MAX_ENTRIES) {
    unverifiedHostnameExpiries.clear();
  }

  unverifiedHostnameExpiries.set(hostname, Date.now() + UNVERIFIED_HOSTNAME_TTL_MS);
}

function originMatchesStaticEntry(origin: string, entry: string): boolean {
  const trimmedEntry = entry.trim();

  if (!trimmedEntry.includes('*')) {
    return origin === trimmedEntry;
  }

  const regex = new RegExp(
    `^${trimmedEntry
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`
  );

  return regex.test(origin);
}

function isClassroomioHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  return FIRST_PARTY_ROOTS.some((root) => host === root || host.endsWith(`.${root}`));
}

export function trustCustomDomainHostname(hostname: string): void {
  const normalized = hostname.trim().toLowerCase();

  if (normalized) {
    verifiedCustomDomainHostnames.add(normalized);
    unverifiedHostnameExpiries.delete(normalized);
  }
}

export function untrustCustomDomainHostname(hostname: string): void {
  verifiedCustomDomainHostnames.delete(hostname.trim().toLowerCase());
}

export async function preloadVerifiedCustomDomainOrigins(): Promise<void> {
  const hostnames = await getVerifiedCustomDomainHostnames();

  verifiedCustomDomainHostnames.clear();

  for (const hostname of hostnames) {
    verifiedCustomDomainHostnames.add(hostname);
  }
}

/**
 * Resolves whether a browser `Origin` header value is allowed for CORS / Better Auth.
 * `staticTrustedOriginEntries` may include exact origins or `*` patterns (e.g. https://*.classroomio.com).
 */
export function resolveTrustedBrowserOrigin(
  origin: string | undefined | null,
  staticTrustedOriginEntries: readonly string[]
): string | undefined {
  if (!origin || origin === 'null') {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return undefined;
  }

  for (const entry of staticTrustedOriginEntries) {
    if (originMatchesStaticEntry(origin, entry)) {
      return origin;
    }
  }

  const hostname = parsed.hostname;

  if (process.env.NODE_ENV !== 'production' && isLocalOrPrivateHost(hostname)) {
    return origin;
  }

  if (isClassroomioHost(hostname)) {
    return origin;
  }

  if (verifiedCustomDomainHostnames.has(hostname.toLowerCase())) {
    return origin;
  }

  return undefined;
}

/**
 * Like `resolveTrustedBrowserOrigin`, but falls back to the database for hosts missing from the
 * in-memory registry (cold start, other API instance). Only https verified custom domains qualify.
 */
export async function resolveTrustedCallbackOrigin(
  callbackUrl: string | undefined | null,
  staticTrustedOriginEntries: readonly string[]
): Promise<string | undefined> {
  if (!callbackUrl) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(callbackUrl);
  } catch {
    return undefined;
  }

  const trusted = resolveTrustedBrowserOrigin(parsed.origin, staticTrustedOriginEntries);

  if (trusted) {
    return trusted;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol !== 'https:' || isRecentlyUnverified(hostname)) {
    return undefined;
  }

  if (!(await isVerifiedCustomDomainHostname(hostname))) {
    rememberUnverified(hostname);
    return undefined;
  }

  trustCustomDomainHostname(hostname);

  return parsed.origin;
}
