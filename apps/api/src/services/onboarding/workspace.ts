import { AppError, ErrorCodes } from '@api/utils/errors';
import { captureServerEvent } from '@cio/core/services/posthog';
import { advanceOnboardingPhase, claimOnboardingOrganization, getLatestStarterJob } from '@cio/db/queries';
import { updateProfile } from '@cio/db/queries/auth';
import { db } from '@cio/db/drizzle';
import type { TOnboardingWorkspace } from '@cio/utils/validation/onboarding';

import { updateOrg } from '@api/services/organization';
import { createOrganizationWithOwner } from './organization';
import { getOnboardingState, phasesFrom, requireOnboardingSession } from './session';
import { startStarterJob } from './starter';

async function updateWorkspace(organizationId: string, profileId: string, input: TOnboardingWorkspace) {
  await db.transaction(async (tx) => {
    await updateProfile(profileId, { fullname: input.fullname }, tx);
    await updateOrg(organizationId, { name: input.orgName, siteName: input.siteName }, tx);
  });

  const existingJob = await getLatestStarterJob(organizationId);
  if (!existingJob) {
    await startStarterJob({ organizationId, profileId });
  }
}

/**
 * Creates the organization on the first call and starts the starter courses. When the user comes back to this
 * step after the organization exists, it updates the name and address instead, and starts a job only if the first
 * attempt never created one.
 */
export async function submitWorkspace(profileId: string, input: TOnboardingWorkspace) {
  const session = await requireOnboardingSession(profileId, phasesFrom('workspace'));

  if (session.phase === 'business') {
    throw new AppError('Complete the business step first', ErrorCodes.ONBOARDING_PHASE_MISMATCH, 409);
  }

  if (session.organizationId) {
    await updateWorkspace(session.organizationId, profileId, input);
    await advanceOnboardingPhase(profileId, ['workspace'], 'customise');

    return getOnboardingState(profileId);
  }

  const { organization } = await createOrganizationWithOwner(profileId, input, 'onboarding', async (tx, created) => {
    const claimed = await claimOnboardingOrganization(profileId, created.id, tx);
    if (!claimed) {
      throw new AppError('This workspace was already created', ErrorCodes.ONBOARDING_PHASE_MISMATCH, 409);
    }

    await advanceOnboardingPhase(profileId, ['workspace'], 'customise', tx);
  });

  const starterJob = await startStarterJob({ organizationId: organization.id, profileId });

  captureServerEvent({
    event: 'onboarding_workspace_created',
    distinctId: profileId,
    orgId: organization.id,
    properties: { starter_mode: starterJob.mode }
  });

  return getOnboardingState(profileId);
}
