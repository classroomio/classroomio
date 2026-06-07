import { workbench } from '@getworkbench/hono';
import type { Context, Hono, Next } from 'hono';

import { getQueue, isRedisConfigured, listQueueNames } from '@cio/jobs';
import { env } from '@cio/core/config/env';

/**
 * Mounts the Workbench UI at `/admin/queues` for inspecting BullMQ state
 * (jobs, flows, metrics, schedulers, retries, etc.).
 *
 * Access control:
 * - Development: open (matches existing dev ergonomics).
 * - Production: HTTP Basic Auth with `QUEUE_DASHBOARD_PASSWORD` (browser-native
 *   prompt, keeps the secret out of the URL/history). Any username is accepted;
 *   only the password is checked. Leave the var unset to keep the dashboard
 *   unmounted (and the route hidden) outside dev.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountQueueDashboard(app: Hono<any, any, any>): void {
  if (!isRedisConfigured()) {
    console.warn('Queue dashboard not mounted: REDIS_URL is not set.');
    return;
  }

  const isProduction = env.NODE_ENV === 'production';
  if (isProduction && !env.QUEUE_DASHBOARD_PASSWORD) {
    console.info(
      'Queue dashboard (/admin/queues) not mounted in production. Set QUEUE_DASHBOARD_PASSWORD to enable it.'
    );
    return;
  }

  if (isProduction) {
    app.use('/admin/queues/*', queueDashboardAuth);
    app.use('/admin/queues', queueDashboardAuth);
  }

  app.route(
    '/admin/queues',
    workbench({
      basePath: '/admin/queues',
      queues: listQueueNames().map((name) => getQueue(name)),
      title: 'ClassroomIO Jobs'
    })
  );
}

async function queueDashboardAuth(c: Context, next: Next): Promise<Response | void> {
  if (matchesBasicAuth(c)) {
    return next();
  }

  return c.body(null, 401, {
    'WWW-Authenticate': 'Basic realm="ClassroomIO Queues", charset="UTF-8"'
  });
}

function matchesBasicAuth(c: Context): boolean {
  const expected = env.QUEUE_DASHBOARD_PASSWORD;
  if (!expected) return false;

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Basic ')) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice('Basic '.length).trim(), 'base64').toString('utf-8');
  } catch {
    return false;
  }

  // Credentials are `username:password`; the username is ignored.
  const password = decoded.slice(decoded.indexOf(':') + 1);

  return timingSafeEqual(password, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}
