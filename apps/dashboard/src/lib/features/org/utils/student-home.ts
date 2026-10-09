/**
 * Final guard before a server redirect: the API derives paths from the
 * registry or a course FK, but the dashboard never redirects off-origin
 * or to itself even if the API ever returned something unexpected.
 */
export function isSafeStudentHomePath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || path === '/') {
    return false;
  }

  return /^\/(lms|courses|course)(\/|$)/.test(path);
}
