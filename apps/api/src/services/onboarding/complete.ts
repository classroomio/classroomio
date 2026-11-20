import { captureServerEvent } from '@cio/core/services/posthog';
import { getLatestStarterJob, updateOnboardingSession } from '@cio/db/queries';
import type { TOnboardingComplete, TOnboardingTourUpdate } from '@cio/utils/validation/onboarding';

import { getOnboardingState, requireOnboardingSession } from './session';

/**
 * Finishes onboarding. Customise is the last step, so this runs right after it. Repeating it is a no-op.
 */
export async function completeOnboarding(profileId: string, input: TOnboardingComplete) {
  const session = await requireOnboardingSession(profileId, ['customise', 'complete']);
  if (session.phase === 'complete') return getOnboardingState(profileId);

  const completedAt = new Date();
  const tourStatus = input.via === 'skip_to_academy' ? 'dismissed' : 'pending';

  await updateOnboardingSession(profileId, {
    phase: 'complete',
    completedAt: completedAt.toISOString(),
    completedVia: input.via,
    tour: { status: tourStatus, completedStepIds: [] }
  });

  const starterJob = session.organizationId ? await getLatestStarterJob(session.organizationId) : null;
  const durationMs = completedAt.getTime() - new Date(session.createdAt).getTime();

  captureServerEvent({
    event: 'onboarding_completed',
    distinctId: profileId,
    orgId: session.organizationId ?? undefined,
    properties: { via: input.via, duration_ms: durationMs, starter_mode: starterJob?.mode ?? null }
  });

  return getOnboardingState(profileId);
}

/**
 * Records tour progress. Never moves the onboarding phase.
 */
export async function updateOnboardingTour(profileId: string, update: TOnboardingTourUpdate) {
  const session = await requireOnboardingSession(profileId, ['complete']);

  const completedStepIds = new Set(session.tour.completedStepIds ?? []);
  if (update.completedStepId) completedStepIds.add(update.completedStepId);

  const tour = {
    status: update.status ?? session.tour.status ?? 'pending',
    completedStepIds: [...completedStepIds]
  };

  await updateOnboardingSession(profileId, { tour });

  return tour;
}
