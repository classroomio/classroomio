/**
 * One-time (manual, not cron) backfill: for every org with an `organization_plan`
 * row still marked active, re-check the real subscription status with Polar and
 * downgrade (deactivate the plan row) any whose subscription has actually ended
 * — covers subscriptions that expired or didn't renew before the webhook handler
 * started reacting to `subscription.revoked`. Dry-run by default; pass --execute
 * to actually deactivate.
 *
 * Usage:
 *   pnpm db:downgrade-expired-subscriptions             # dry run (default)
 *   pnpm db:downgrade-expired-subscriptions -- --execute # deactivate
 *
 * Env:
 *   POLAR_ACCESS_TOKEN - required
 *   POLAR_SERVER        - "production" (default) or "sandbox"
 */
import 'dotenv/config';

import {
  cancelOrganizationPlan,
  getActiveOrganizationPlansWithSubscription
} from '../queries/organization/organization';

const POLAR_SERVER = process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production';
const POLAR_API_BASE = POLAR_SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

async function fetchSubscription(subscriptionId: string, accessToken: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${POLAR_API_BASE}/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Polar responded ${response.status} for subscription ${subscriptionId}`);
  }

  return response.json();
}

async function main() {
  const execute = process.argv.includes('--execute');
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is required');
  }

  console.log(`Checking active org plans against Polar (${POLAR_SERVER})...`);

  const activePlans = await getActiveOrganizationPlansWithSubscription();

  let downgraded = 0;
  let stillActive = 0;
  let errored = 0;

  for (const plan of activePlans) {
    const subscriptionId = plan.subscriptionId;

    if (!subscriptionId) continue;

    try {
      const subscription = await fetchSubscription(subscriptionId, accessToken);

      if (subscription.status === 'active') {
        stillActive++;
        continue;
      }

      console.log(
        `${execute ? 'Downgrading' : '[dry-run] Would downgrade'} ${plan.orgName} (${plan.orgId}): ` +
          `subscription ${subscriptionId} is "${subscription.status}"`
      );

      if (execute) {
        await cancelOrganizationPlan(subscriptionId, subscription);
      }

      downgraded++;
    } catch (error) {
      errored++;
      console.error(`Skipping ${plan.orgName} (${plan.orgId}): ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(
    `\nChecked ${activePlans.length} active org plan(s): ${stillActive} still active, ` +
      `${downgraded} to downgrade${errored ? `, ${errored} error(s)` : ''}.`
  );
  console.log(execute ? `Done. Downgraded ${downgraded} org(s).` : 'Dry run — re-run with --execute to downgrade.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
