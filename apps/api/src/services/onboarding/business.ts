import { captureServerEvent } from '@cio/core/services/posthog';
import { db } from '@cio/db/drizzle';
import { advanceOnboardingPhase, updateOnboardingSession } from '@cio/db/queries';
import { updateProfile } from '@cio/db/queries/auth';
import type { TOnboardingSession, TProfile } from '@cio/db/types';
import { extractWebsiteBrand } from '@cio/core/services/onboarding/index';
import type {
  TOnboardingBusiness,
  TOnboardingBusinessDraft,
  TOnboardingFirstOutcome
} from '@cio/utils/validation/onboarding';

import { getOnboardingState, phasesFrom, requireOnboardingSession } from './session';

const USE_CASE_BY_OUTCOME: Record<TOnboardingFirstOutcome, string> = {
  'onboard-customers': 'customer-training',
  'explain-product': 'customer-training',
  'increase-adoption': 'customer-training',
  'cut-tickets': 'customer-training'
};

function profilePatchFromBusiness(business: TOnboardingBusinessDraft): Partial<TProfile> {
  const patch: Partial<TProfile> = {};

  if (business.firstOutcome) patch.useCases = [USE_CASE_BY_OUTCOME[business.firstOutcome]];
  if (business.jobRole) patch.jobRole = business.jobRole;
  if (business.companySize) patch.companySize = business.companySize;
  if (business.learningMethod) patch.learningMethod = business.learningMethod;
  if (business.source !== undefined) patch.source = business.source;
  if (business.sourceOther !== undefined) patch.sourceOther = business.sourceOther;
  if (business.aiProvider !== undefined) patch.aiProvider = business.aiProvider;
  if (business.aiProviderOther !== undefined) patch.aiProviderOther = business.aiProviderOther;

  return patch;
}

function mergeBusiness(
  current: TOnboardingSession['business'],
  incoming: TOnboardingBusinessDraft
): TOnboardingBusinessDraft {
  const merged: TOnboardingBusinessDraft = { ...current };

  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

async function persistBusiness(profileId: string, business: TOnboardingBusinessDraft) {
  const profilePatch = profilePatchFromBusiness(business);

  await db.transaction(async (tx) => {
    await updateOnboardingSession(profileId, { business }, tx);

    if (Object.keys(profilePatch).length > 0) {
      await updateProfile(profileId, profilePatch, tx);
    }
  });
}

/**
 * Saves answers while the user is still typing. Nothing here moves the session forward.
 */
export async function saveBusinessDraft(profileId: string, draft: TOnboardingBusinessDraft) {
  const session = await requireOnboardingSession(profileId, phasesFrom('business'));

  await persistBusiness(profileId, mergeBusiness(session.business, draft));
}

async function refreshBrandInBackground(profileId: string, websiteUrl: string) {
  try {
    const brand = await extractWebsiteBrand(websiteUrl);
    const session = await requireOnboardingSession(profileId, phasesFrom('business'));

    await updateOnboardingSession(profileId, { brand: { ...session.brand, ...brand } });
  } catch (error) {
    console.warn('onboarding.website_brand_failed', { profileId, error: String(error) });
  }
}

/**
 * Validates and stores the full set of business answers, then moves the session to the workspace step.
 */
export async function submitBusiness(profileId: string, business: TOnboardingBusiness) {
  const session = await requireOnboardingSession(profileId, phasesFrom('business'));

  await persistBusiness(profileId, mergeBusiness(session.business, business));
  await advanceOnboardingPhase(profileId, ['business'], 'workspace');

  captureServerEvent({
    event: 'onboarding_business_submitted',
    distinctId: profileId,
    properties: {
      first_outcome: business.firstOutcome,
      context_mode: business.contextMode,
      company_size: business.companySize,
      job_role: business.jobRole
    }
  });

  const isSameWebsite = session.business.websiteUrl === business.websiteUrl;
  const hasBrand = Boolean(session.brand.productName || session.brand.siteTitle || session.brand.detectedColour);
  if (business.contextMode === 'website' && business.websiteUrl && !(isSameWebsite && hasBrand)) {
    void refreshBrandInBackground(profileId, business.websiteUrl);
  }

  return getOnboardingState(profileId);
}
