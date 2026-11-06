import { ROLE } from '@cio/utils/constants';
import { getActiveOrgPlan, type OrgPlanLike } from '@cio/utils/plans';
import type { BillingPortalAccess } from './types';

type BillingPortalOrganization = {
  id: string;
  roleId?: number | null;
  plans?: Array<OrgPlanLike & { customerId?: string | null; customer_id?: string | null }> | null;
};

/**
 * Decides whether the signed-in user may open the billing portal for `orgId`,
 * using their own memberships. Only org admins are allowed.
 */
export function resolveBillingPortalAccess(
  organizations: BillingPortalOrganization[],
  orgId: string | null
): BillingPortalAccess {
  const organization = orgId ? organizations.find((candidate) => candidate.id === orgId) : undefined;
  if (!organization || organization.roleId !== ROLE.ADMIN) {
    return { status: 'forbidden' };
  }

  const activePlan = getActiveOrgPlan(organization.plans);
  const customerId = activePlan?.customerId ?? activePlan?.customer_id;
  if (!customerId) {
    return { status: 'no-customer' };
  }

  return { status: 'allowed', customerId };
}
