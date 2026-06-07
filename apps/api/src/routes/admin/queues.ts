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
 * - Production: requires either
 *   - a Better Auth session whose `user.email` is in
 *     `QUEUE_DASHBOARD_ADMIN_EMAILS` (comma-separated), or
 *   - the `QUEUE_DASHBOARD_TOKEN` bearer escape hatch via header or `?token=`.
 *   Failures return `404` so the route doesn't reveal its existence.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountQueueDashboard(app: Hono<any, any, any>): void {
  if (!isRedisConfigured()) {
    console.warn('Queue dashboard not mounted: REDIS_URL is not set.');
    return;
  }

  const isProduction = env.NODE_ENV === 'production';
  if (isProduction && !canEnforceProdAuth()) {
    console.info(
      'Queue dashboard (/admin/queues) not mounted in production. Set QUEUE_DASHBOARD_ADMIN_EMAILS or QUEUE_DASHBOARD_TOKEN to enable it.'
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

function canEnforceProdAuth(): boolean {
  return Boolean(adminEmailSet().size > 0 || env.QUEUE_DASHBOARD_TOKEN);
}

function adminEmailSet(): Set<string> {
  const raw = env.QUEUE_DASHBOARD_ADMIN_EMAILS ?? '';
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function queueDashboardAuth(c: Context, next: Next): Promise<Response | void> {
  if (matchesEscapeHatch(c)) {
    return next();
  }

  const user = c.get('user') as { email?: string | null } | null;
  const email = user?.email?.toLowerCase();
  if (email && adminEmailSet().has(email)) {
    return next();
  }

  // Hide existence rather than 401/403 — fewer hints for crawlers/scanners.
  return c.notFound();
}

function matchesEscapeHatch(c: Context): boolean {
  const expected = env.QUEUE_DASHBOARD_TOKEN;
  if (!expected) return false;

  const headerToken = c.req
    .header('Authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  const queryToken = c.req.query('token');
  const provided = headerToken || queryToken;

  return Boolean(provided && timingSafeEqual(provided, expected));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}
