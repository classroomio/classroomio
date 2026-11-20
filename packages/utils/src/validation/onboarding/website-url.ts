const RESERVED_TOP_LEVEL_DOMAINS = ['test', 'example', 'invalid', 'local', 'localhost', 'internal', 'lan', 'home'];
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;
const HOSTNAME_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_WEBSITE_URL_LENGTH = 2048;

function isPublicHostname(hostname: string): boolean {
  if (hostname.startsWith('[') || IPV4_PATTERN.test(hostname)) return false;

  const labels = hostname.split('.');
  if (labels.length < 2) return false;

  const topLevelDomain = labels[labels.length - 1];
  if (RESERVED_TOP_LEVEL_DOMAINS.includes(topLevelDomain) || /^\d+$/.test(topLevelDomain)) return false;

  return labels.every((label) => HOSTNAME_LABEL_PATTERN.test(label));
}

/**
 * Normalises what a user typed as their website into an absolute http(s) URL on a public hostname.
 * Bare domains get `https://`. Returns null for anything else: other schemes, credentials, custom ports,
 * IP addresses, single-label hosts and reserved top-level domains.
 */
export function normalizeWebsiteUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_WEBSITE_URL_LENGTH || /\s/.test(trimmed)) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  if (parsed.username || parsed.password || parsed.port) return null;

  if (!isPublicHostname(parsed.hostname.toLowerCase())) return null;

  parsed.hash = '';

  return parsed.href;
}

/** Hostname without a leading `www.`, for display. Returns null when the value is not a usable website. */
export function getWebsiteHost(input: string): string | null {
  const normalized = normalizeWebsiteUrl(input);
  if (!normalized) return null;

  return new URL(normalized).hostname.replace(/^www\./, '');
}
