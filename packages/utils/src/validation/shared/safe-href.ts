const ALLOWED_SCHEMES = /^(https?|mailto|tel):/i;
const PLAIN_PATH = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;

function hasAllowedScheme(value: string): boolean {
  if (ALLOWED_SCHEMES.test(value)) return true;
  if (value.startsWith('#')) return true;
  if (value.startsWith('/')) return true;
  if (value.startsWith('./') || value.startsWith('../')) return true;
  if (PLAIN_PATH.test(value)) return true;

  return false;
}

/**
 * Returns true if the value is a safe href: an allowed scheme (http, https,
 * mailto, tel), a fragment-only anchor (#…), or a relative path (/, ./, ../).
 * Rejects javascript:, data:, vbscript:, and any other scheme.
 */
export function isAllowedHref(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return hasAllowedScheme(trimmed);
}

/**
 * Recursively walks a value and returns true if any string leaf matches a
 * disallowed href scheme. Used for Zod refinements on freeform JSON blobs.
 */
export function containsDisallowedHrefs(value: unknown): boolean {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && !hasAllowedScheme(trimmed)) {
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
