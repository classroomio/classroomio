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

export function getHasCioCookies(cookies: Cookies): boolean {
  const cioCookies = cookies.getAll().filter((c) => c.name.includes('classroomio'));

  if (cioCookies.length === 0) return false;

  // check if the cookies doesn't includ ONLY classroomio_locale
  const onlyLocaleCookie = cioCookies.every((c) => c.name === 'classroomio_locale');

  return !onlyLocaleCookie;
}
