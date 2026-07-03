import { PLAN } from './constants';

export type OrgPlanLike = {
  planName: string | null;
  isActive: boolean | null;
};

export function isOrgOnFreePlan(plans: OrgPlanLike[] | undefined | null, isSelfHosted: boolean): boolean {
  if (isSelfHosted) {
    return false;
  }

  const activePlan = plans?.find((plan) => plan.isActive);

  return !activePlan || activePlan.planName === PLAN.BASIC;
}
