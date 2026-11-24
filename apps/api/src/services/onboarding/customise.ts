import { AppError, ErrorCodes } from '@api/utils/errors';
import { updateOrg } from '@api/services/organization';
import { captureServerEvent } from '@cio/core/services/posthog';
import { getOrganizationById } from '@cio/db/queries';
import { ONBOARDING_BRAND_PRESETS } from '@cio/utils/constants/onboarding';
import type { TOnboardingCustomise } from '@cio/utils/validation/onboarding';

import { getOnboardingState, requireOnboardingSession } from './session';
import { applyStarterDrafts } from './starter';

/**
 * Saves the academy name, brand colour and theme, then creates the starter courses. Customise is the last
 * step, so the session stays on `customise` and `completeOnboarding` finishes the flow.
 * Branding is saved first, so a premium theme on a free plan fails with UPGRADE_REQUIRED before any course exists.
 * Callable again: the courses already created are left as they are.
 */
export async function applyCustomisation(profileId: string, input: TOnboardingCustomise) {
  const session = await requireOnboardingSession(profileId, ['customise']);

  const organization = session.organizationId ? await getOrganizationById(session.organizationId) : null;
  if (!organization) {
    throw new AppError('Workspace not created yet', ErrorCodes.ONBOARDING_PHASE_MISMATCH, 409);
  }

  const currentLandingPage = (organization.landingpage ?? {}) as Record<string, unknown>;

  await updateOrg(organization.id, {
    name: input.orgName,
    theme: input.brandColour,
    landingpage: { ...currentLandingPage, theme: input.landingTheme }
  });

  const starterCourseIds = await applyStarterDrafts(organization.id, profileId);

  const isPreset = (ONBOARDING_BRAND_PRESETS as readonly string[]).includes(input.brandColour);

  captureServerEvent({
    event: 'onboarding_customise_applied',
    distinctId: profileId,
    orgId: organization.id,
    properties: {
      theme: input.landingTheme,
      colour_kind: isPreset ? 'preset' : 'custom',
      starter_courses: starterCourseIds.length
    }
  });

  const state = await getOnboardingState(profileId);

  return { ...state, starterCourseIds };
}
