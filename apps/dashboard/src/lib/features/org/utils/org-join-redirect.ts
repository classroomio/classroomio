const DEFAULT_JOIN_REDIRECT = '/lms';

export function resolveOrgJoinRedirect(redirectTo: string, origin: string): string {
  try {
    const destination = new URL(redirectTo, origin);
    if (destination.origin !== origin) {
      return DEFAULT_JOIN_REDIRECT;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_JOIN_REDIRECT;
  }
}

/**
 * Picks the post-join destination: an explicit redirect wins, otherwise orgs
 * with a student home send new students through `/` so the server redirect
 * resolves it, and everyone else keeps `/lms`.
 */
export function getPostJoinRedirect(
  org: { hasStudentHome?: boolean } | null | undefined,
  redirectParam: string | null
): string {
  if (redirectParam) {
    return redirectParam;
  }

  return org?.hasStudentHome ? '/' : DEFAULT_JOIN_REDIRECT;
}
