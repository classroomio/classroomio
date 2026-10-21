import { dedupe } from './array';

/**
 * Generic link utilities for extracting URLs from snippets, splitting user input,
 * and normalizing HTTP/HTTPS URLs.
 */

/**
 * Extracts the src URL from an <iframe> embed snippet, or returns the trimmed input if not an iframe.
 */
export function extractIframeSrcOrUrl(input = ''): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    return iframeMatch[1].trim();
  }

  return trimmed;
}

/**
 * Splits comma-separated links from a user input string, extracting URLs from iframe snippets
 * when present and trimming each entry.
 */
export function splitLinks(rawInput = ''): string[] {
  return rawInput
    .split(',')
    .map((entry) => extractIframeSrcOrUrl(entry))
    .filter(Boolean);
}

/**
 * Ensures an input string (or extracted iframe src) has an HTTP or HTTPS scheme.
 * Defaults to https:// if no protocol is present.
 */
export function ensureHttpsProtocol(rawLink = ''): string {
  const extracted = extractIframeSrcOrUrl(rawLink);
  if (!extracted) {
    return '';
  }

  return /^https?:\/\//i.test(extracted) ? extracted : `https://${extracted}`;
}

/**
 * Normalizes an HTTP/HTTPS URL:
 * 1. Ensures https:// protocol if missing
 * 2. Normalizes hostname (lowercased, www. stripped)
 * 3. Removes trailing slashes on non-root paths
 * 4. Sorts query parameters deterministically
 */
export function normalizeHttpUrl(rawLink = ''): string {
  const withProtocol = ensureHttpsProtocol(rawLink);
  if (!withProtocol) {
    return '';
  }

  try {
    const parsed = new URL(withProtocol);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const params = new URLSearchParams(parsed.search);
    params.sort();
    const paramsString = params.toString();
    const search = paramsString ? `?${paramsString}` : '';

    return `https://${hostname}${pathname}${search}`;
  } catch {
    return withProtocol;
  }
}

/**
 * Splits, optionally transforms (e.g. canonicalizes or validates), and deduplicates links from user input.
 *
 * @param rawInput - Comma-separated links string or iframe snippet
 * @param transformFn - Optional transformation/normalization function; truthy returned strings are kept
 * @returns Deduplicated array of processed links
 */
export function extractUniqueLinks(rawInput = '', transformFn?: (link: string) => string | null | undefined): string[] {
  const rawLinks = splitLinks(rawInput);
  if (!transformFn) {
    return dedupe(rawLinks);
  }

  const transformed = rawLinks.map(transformFn).filter((entry): entry is string => Boolean(entry));

  return dedupe(transformed);
}
