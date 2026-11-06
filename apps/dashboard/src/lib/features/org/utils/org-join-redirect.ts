import { STUDENT_HOME_ENTRY_PATH } from '@cio/utils/lms';

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
 * Picks the post-join destination: an explicit redirect wins, otherwise the
 * student-home entry route, which falls back to `/lms`.
 */
export function getPostJoinRedirect(redirectParam: string | null): string {
  return redirectParam || STUDENT_HOME_ENTRY_PATH;
}
