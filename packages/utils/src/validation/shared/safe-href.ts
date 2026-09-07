const ALLOWED_SCHEMES = /^(https?|mailto|tel):/i;
const DISALLOWED_SCHEMES = /^(javascript|data|vbscript)$/i;

function hasAllowedScheme(value: string): boolean {
  if (ALLOWED_SCHEMES.test(value)) return true;
  if (value.startsWith('#')) return true;
  if (value.startsWith('/')) return true;
  if (value.startsWith('./') || value.startsWith('../')) return true;
  if (value.startsWith('?')) return true;

  return false;
}

/**
 * Returns true if the value is a safe href: an allowed scheme (http, https,
 * mailto, tel), a fragment-only anchor (#…), a query-only string (?…),
 * or a relative path (/, ./, ../).
 * Rejects javascript:, data:, vbscript:, and any other scheme.
 */
export function isAllowedHref(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return hasAllowedScheme(trimmed);
}

/**
 * Returns true if the string contains a colon-delimited scheme that is
 * disallowed (javascript:, data:, vbscript:). Strings without a colon
 * (plain text, headings, labels) are always safe and return false.
 */
function hasDisallowedScheme(value: string): boolean {
  const colonIndex = value.indexOf(':');
  if (colonIndex < 0) return false;
  const scheme = value.slice(0, colonIndex).replace(/[\s\x00-\x1f]+/g, '');
  return DISALLOWED_SCHEMES.test(scheme);
}

/**
 * Recursively walks a value and returns true if any string leaf contains a
 * disallowed href scheme (javascript:, data:, vbscript:). Strings without
 * a colon (plain text like headings and labels) are safe and skipped.
 * Used for Zod refinements on freeform JSON blobs.
 */
export function containsDisallowedHrefs(value: unknown): boolean {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && hasDisallowedScheme(trimmed)) {
      return true;
    }
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(containsDisallowedHrefs);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).some(containsDisallowedHrefs);
  }

  return false;
}
