/**
 * Public org-site pages (landing, catalog, course landing, enroll) always use light mode.
 * Authenticated areas on the same tenant host (e.g. /lms, /courses/:id) keep the theme selector.
 */
const PUBLIC_ORG_SITE_PATH_PATTERNS = [
  /^\/$/,
  /^\/courses\/?$/,
  /^\/course\/[^/]+\/?$/,
  /^\/course\/[^/]+\/enroll\/?$/
] as const;

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split('?')[0] ?? '/';
  if (pathOnly === '/') {
    return '/';
  }

  return pathOnly.replace(/\/+$/, '') || '/';
}

export function isPublicOrgSitePage(isOrgSite: boolean, pathname: string): boolean {
  if (!isOrgSite) {
    return false;
  }

  const normalizedPath = normalizePathname(pathname);
  return PUBLIC_ORG_SITE_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}
