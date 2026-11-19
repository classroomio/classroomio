import { createRateLimiter } from '@api/middlewares/rate-limiter';

export const analyticsQueryRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: 'Too many analytics queries. Please try again shortly.',
  failClosed: true,
  keyGenerator: (c) => `analytics_query:${c.get('automationKey')?.id ?? 'missing-key'}`
});

export const analyticsSnapshotRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  message: 'Too many analytics snapshots. Please try again shortly.',
  failClosed: true,
  keyGenerator: (c) => `analytics_snapshot:${c.get('automationKey')?.id ?? 'missing-key'}`
});
