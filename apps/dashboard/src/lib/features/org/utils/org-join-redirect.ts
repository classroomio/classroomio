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
