import type { Context } from 'hono';
import { getZapierRateLimits } from '@cio/utils/plans';

import { DEFAULT_WINDOW_MS } from '@api/constants/rate-limiter';
import { getConnectedAppKind } from '@api/services/oauth/clients';
import { createRateLimiter } from './rate-limiter';

type TZapierRequestCategory = 'read' | 'write';

export function isZapierRequest(c: Context): boolean {
  const clientId = c.get('oauthClientId');

  return Boolean(clientId) && getConnectedAppKind(clientId) === 'zapier';
}

export function getZapierRequestCategory(c: Context): TZapierRequestCategory {
  return c.req.method === 'GET' || c.req.method === 'HEAD' ? 'read' : 'write';
}

/**
 * Limits are per organization, so connecting more Zapier accounts does not raise the ceiling.
 */
export function zapierRateLimitKey(c: Context): string {
  return `zapier:${c.get('orgId')}:${getZapierRequestCategory(c)}`;
}

export function getZapierRequestLimit(c: Context): number {
  const limits = getZapierRateLimits(c.get('oauthPlanName'));

  return getZapierRequestCategory(c) === 'read' ? limits.readPerMinute : limits.writePerMinute;
}

export const zapierRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: getZapierRequestLimit,
  keyGenerator: zapierRateLimitKey,
  skip: (c) => !isZapierRequest(c)
});
