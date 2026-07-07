import { PLAN } from './constants';

export function canUsePublicApi(planName: string | null | undefined, isSelfHosted: boolean): boolean {
  if (!planName || planName === PLAN.BASIC) {
    return false;
  }

  if (isSelfHosted) {
    return planName === PLAN.ENTERPRISE;
  }

  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}
