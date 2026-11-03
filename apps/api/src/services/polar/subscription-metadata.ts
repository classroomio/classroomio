import { env } from '@cio/core/config/env';

const POLAR_API_URLS = {
  production: 'https://api.polar.sh/v1',
  sandbox: 'https://sandbox-api.polar.sh/v1'
};

export type SubscriptionOrgMetadata = {
  orgId: string;
  orgSlug: string | null;
  triggeredBy: number;
};

/**
 * Tags a Polar subscription with the organization that owns it, keeping the metadata it already has.
 * Never throws: a missing token or a Polar failure is logged and the caller carries on.
 */
export async function tagPolarSubscriptionWithOrg(
  subscriptionId: string,
  existingMetadata: Record<string, unknown>,
  orgMetadata: SubscriptionOrgMetadata
): Promise<void> {
  if (!env.POLAR_ACCESS_TOKEN) {
    console.error('tagPolarSubscriptionWithOrg skipped: POLAR_ACCESS_TOKEN is not configured');

    return;
  }

  const baseUrl = env.NODE_ENV === 'production' ? POLAR_API_URLS.production : POLAR_API_URLS.sandbox;
  const { orgId, orgSlug, triggeredBy } = orgMetadata;
  const metadata = {
    ...existingMetadata,
    orgId,
    ...(orgSlug ? { orgSlug } : {}),
    triggeredBy: String(triggeredBy)
  };

  try {
    const response = await fetch(`${baseUrl}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata })
    });

    if (!response.ok) {
      console.error('tagPolarSubscriptionWithOrg error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('tagPolarSubscriptionWithOrg error:', error);
  }
}
