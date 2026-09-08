import { PLAN } from './constants';

export type OrgPlanLike = {
  planName: string | null;
  isActive: boolean | null;
};

export type IsOrgOnFreePlanOptions = {
  plans?: OrgPlanLike[] | null;
  isSelfHosted: boolean;
  orgId?: string | null;
};

export function getActiveOrgPlan<T extends OrgPlanLike>(plans?: readonly T[] | null): T | undefined {
  return plans?.find((plan) => plan.isActive === true);
}

export function isOrgOnFreePlan({ plans, isSelfHosted, orgId }: IsOrgOnFreePlanOptions): boolean {
  if (!orgId) {
    return false;
  }

  if (isSelfHosted) {
    return false;
  }

  const activePlan = getActiveOrgPlan(plans);

  return !activePlan || activePlan.planName === PLAN.BASIC;
}
