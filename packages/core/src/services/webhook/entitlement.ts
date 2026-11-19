import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { canUsePublicApi } from '@cio/utils/plans';

import { env } from '../../config/env';

export async function hasWebhookEntitlement(organizationId: string): Promise<boolean> {
  const activePlan = await getActiveOrganizationPlan(organizationId);

  return canUsePublicApi(activePlan?.planName ?? null, env.PUBLIC_IS_SELFHOSTED === 'true');
}
