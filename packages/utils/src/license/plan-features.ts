import { PLAN } from '../plans/constants';
import { LICENSE_FEATURE, type LicenseFeatureId } from './constants';

type OrgPlan = {
  planName: string | null;
  isActive: boolean | null;
};

export function getActivePlanName(plans: OrgPlan[] | undefined | null): string | null {
  const activePlan = plans?.find((plan) => plan.isActive);

  return activePlan?.planName ?? null;
}

/**
 * Maps a cloud organization plan to dashboard license feature IDs.
 * Self-hosted instances use instance-level license keys instead.
 */
export function getLicenseFeaturesForPlan(planName: string | null | undefined): LicenseFeatureId[] {
  if (!planName || planName === PLAN.BASIC) {
    return [];
  }

  if (planName === PLAN.EARLY_ADOPTER) {
    return [LICENSE_FEATURE.CUSTOM_DOMAIN, LICENSE_FEATURE.CUSTOM_BRANDING];
  }

  if (planName === PLAN.ENTERPRISE) {
    return Object.values(LICENSE_FEATURE);
  }

  return [];
}
