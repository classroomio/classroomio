import { checkSiteNameExists, getOnboardingSession } from '@cio/db/queries';
import { SITE_NAME_RESERVED_MESSAGE, ZOnboardingCreateOrg } from '@cio/utils/validation/onboarding';

export type SiteNameAvailability =
  | { siteName: string; available: true; reason: null; message: null }
  | { siteName: string; available: false; reason: 'taken' | 'reserved' | 'invalid'; message: string };

/**
 * Tells whether a subdomain can be used. `currentOrgId` lets a user keep the name their own organization already
 * holds. This is advisory: creating the organization checks again, because a name can be taken in between.
 */
export async function checkSiteNameAvailability(
  siteName: string,
  currentOrgId?: string
): Promise<SiteNameAvailability> {
  const parsed = ZOnboardingCreateOrg.shape.siteName.safeParse(siteName);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'validations.site_name.invalid';
    const reason = message === SITE_NAME_RESERVED_MESSAGE ? 'reserved' : 'invalid';

    return { siteName, available: false, reason, message };
  }

  const exists = await checkSiteNameExists(siteName, currentOrgId);
  if (exists) {
    return { siteName, available: false, reason: 'taken', message: 'validations.site_name.taken' };
  }

  return { siteName, available: true, reason: null, message: null };
}

/**
 * Checks a subdomain for the onboarding user, letting them keep the name their own workspace already holds.
 */
export async function checkOnboardingSiteName(profileId: string, siteName: string): Promise<SiteNameAvailability> {
  const session = await getOnboardingSession(profileId);
  const currentOrgId = session?.organizationId ?? undefined;

  return checkSiteNameAvailability(siteName, currentOrgId);
}
