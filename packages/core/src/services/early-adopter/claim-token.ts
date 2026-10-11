import { createHash, createHmac } from 'node:crypto';

import { getAppBaseUrl } from '../../config/dashboard-url';
import { env } from '../../config/env';

const TOKEN_PURPOSE = 'early-adopter-claim';

/**
 * Derives the claim token for a Polar subscription. It is recomputable from the subscription id,
 * so the database only needs its hash while reminder emails can still rebuild the link.
 * Throws when PRIVATE_SERVER_KEY is not configured.
 */
export function deriveEarlyAdopterClaimToken(subscriptionId: string): string {
  const secret = env.PRIVATE_SERVER_KEY;

  if (!secret) {
    throw new Error('PRIVATE_SERVER_KEY is required to derive early adopter claim tokens');
  }

  return createHmac('sha256', secret).update(`${TOKEN_PURPOSE}:${subscriptionId}`).digest('base64url');
}

export function hashEarlyAdopterClaimToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildEarlyAdopterClaimUrl(token: string): string {
  return `${getAppBaseUrl()}/claim/${encodeURIComponent(token)}`;
}
