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

/**
 * Whether the given org plan is allowed to fetch YouTube captions via the
 * provider API. Free (`BASIC`) orgs keep the current no-transcript behavior.
 * Self-hosted is ungated (same pattern as other paid cloud features).
 */
export function canFetchYouTubeCaptions(planName: string | null | undefined, isSelfHosted: boolean): boolean {
  if (isSelfHosted) {
    return true;
  }

  if (!planName || planName === PLAN.BASIC) {
    return false;
  }

  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}
