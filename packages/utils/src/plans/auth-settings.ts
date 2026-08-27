import { PLAN } from './constants';

/**
 * Whether an org may edit the signup-policy controls on
 * Settings > Authentication > General that are not Enterprise-only:
 * "Allow public signups" and "Internal Enrollment Only".
 *
 * The stricter controls on that tab (blocking all signups, the signup-disabled
 * message, and the login-provider toggles) stay Enterprise-only and keep using
 * the enterprise check.
 */
export function canUseBasicAuthSettings(planName: string | null | undefined, isSelfHosted: boolean): boolean {
  if (isSelfHosted) {
    return true;
  }

  if (!planName || planName === PLAN.BASIC) {
    return false;
  }

  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}
