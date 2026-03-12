import type { Cookies } from '@sveltejs/kit';

/**
 * Returns the classroomio cookie string for API/auth requests.
 * Filters cookies whose names include "classroomio" and joins them as `name=value; ...`.
 */
export function getCioCookieString(cookies: Cookies): string {
  return cookies
    .getAll()
    .filter((c) => c.name.includes('classroomio'))
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}
