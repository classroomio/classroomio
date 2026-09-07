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
 * Normalizes an HTTP/HTTPS URL:
 * 1. Ensures https:// protocol if missing
 * 2. Normalizes hostname (lowercased, www. stripped)
 * 3. Removes trailing slashes on non-root paths
 * 4. Sorts query parameters deterministically
 */
export function normalizeHttpUrl(rawLink = ''): string {
  const extracted = extractIframeSrcOrUrl(rawLink);
  if (!extracted) {
    return '';
  }

  try {
    const withProtocol =
      extracted.startsWith('http://') || extracted.startsWith('https://') ? extracted : `https://${extracted}`;
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
    if (extracted.startsWith('http://') || extracted.startsWith('https://')) {
      return extracted;
    }

    return `https://${extracted}`;
  }
}
