import type { Context, MiddlewareHandler } from 'hono';
import { contentHostHeaders, isActivityContentHost, isActivityContentPath } from '@cio/core/config/activity-content';

/**
 * Returns the browser-facing host, preferring the forwarded host behind the Worker.
 */
export function getRequestHost(c: Context): string | null {
  return c.req.header('x-forwarded-host') ?? c.req.header('host') ?? null;
}

/**
 * Returns true when the request arrived on the content host.
 */
export function isContentHostRequest(c: Context): boolean {
  return isActivityContentHost(getRequestHost(c));
}

/**
 * Gates the content host: only player, content and run-time paths serve there.
 */
export const activityContentHostGate: MiddlewareHandler = async (c, next) => {
  if (!isContentHostRequest(c)) {
    await next();
    return;
  }

  if (!isActivityContentPath(c.req.path)) {
    return c.body(null, 404);
  }

  await next();

  const headers = contentHostHeaders([]);
  for (const [name, value] of Object.entries(headers)) {
    if (!c.res.headers.has(name)) {
      c.res.headers.set(name, value);
    }
  }
  c.res.headers.delete('X-Frame-Options');
};
