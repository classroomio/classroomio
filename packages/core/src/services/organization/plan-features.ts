import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { PLAN } from '@cio/utils/plans';

import { env } from '../../config/env';

/**
 * Free-plan orgs do not get certificates.
 * Self-hosted deployments always have certificates enabled.
 */
export async function orgHasCertificatesEnabled(orgId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') {
    return true;
  }

  const activePlan = await getActiveOrganizationPlan(orgId);

  return Boolean(activePlan && activePlan.planName !== PLAN.BASIC);
}
