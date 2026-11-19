import { POSTHOG_KEY } from './constants';

/**
 * Returns the visitor id that posthog-js stored in its cookie, so a server-side event joins the
 * same person as their browser session. Falls back to the forwarded IP, then a timestamp.
 */
export function getDistinctId(request: Request): string {
  const cookieName = `ph_${POSTHOG_KEY}_posthog`;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookie = cookieHeader.split('; ').find((part) => part.startsWith(`${cookieName}=`));

  if (cookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie.slice(cookieName.length + 1)));

      if (typeof parsed.distinct_id === 'string') return parsed.distinct_id;
    } catch {}
  }

  return request.headers.get('x-forwarded-for') || new Date().getTime().toString();
}
