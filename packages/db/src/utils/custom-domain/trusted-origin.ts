import { getVerifiedCustomDomainHostnames } from '../../queries/organization/organization';

const CLASSROOMIO_ROOT = 'classroomio.com';

/** Lowercase hostnames with verified custom domains ( warmed at API boot + updated on domain routes ). */
const verifiedCustomDomainHostnames = new Set<string>();

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

  return host === CLASSROOMIO_ROOT || host.endsWith(`.${CLASSROOMIO_ROOT}`);
}

export function trustCustomDomainHostname(hostname: string): void {
  const normalized = hostname.trim().toLowerCase();

  if (normalized) {
    verifiedCustomDomainHostnames.add(normalized);
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

  if (isClassroomioHost(hostname)) {
    return origin;
  }

  if (verifiedCustomDomainHostnames.has(hostname.toLowerCase())) {
    return origin;
  }

  return undefined;
}
