/**
 * Public org-site pages (landing, catalog, course landing, enroll) always use light mode.
 * Lesson player routes under /course/.../lesson may use the app theme selector.
 */
export function isPublicOrgSitePage(isOrgSite: boolean, pathname: string): boolean {
  if (!isOrgSite) {
    return false;
  }

  return !pathname.includes('/lesson');
}
