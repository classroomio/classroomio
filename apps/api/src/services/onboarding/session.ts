import { AppError, ErrorCodes } from '@api/utils/errors';
import { isOnboardingAiAvailable } from '@cio/core/services/onboarding/index';
import {
  createOnboardingSession,
  getLatestStarterJob,
  getOnboardingSession,
  getOrganizationByProfileId,
  getOrganizationById
} from '@cio/db/queries';
import { syncProfileEmailVerificationFromAuthUser } from '@cio/db/queries/auth';
import type { TOnboardingSession, TOnboardingStarterJob } from '@cio/db/types';
import { ROLE } from '@cio/utils/constants';
import {
  ONBOARDING_PHASES,
  STARTER_JOB_CONTINUE_AFTER_MS,
  type TOnboardingPhase,
  type TOnboardingScreen
} from '@cio/utils/constants/onboarding';
import type { TOnboardingBrand, TOnboardingBusiness, TOnboardingStart } from '@cio/utils/validation/onboarding';

/**
 * Phases from `phase` up to, but not including, `complete`. Use for steps that stay editable while the user
 * moves back and forth.
 */
export function phasesFrom(phase: TOnboardingPhase): TOnboardingPhase[] {
  const startIndex = ONBOARDING_PHASES.indexOf(phase);

  return ONBOARDING_PHASES.slice(startIndex).filter((value) => value !== 'complete');
}

/**
 * Returns the caller's onboarding session. Throws ONBOARDING_SESSION_NOT_FOUND (404) when there is none, and
 * ONBOARDING_PHASE_MISMATCH (409) when the session is not in one of `allowed`.
 */
export async function requireOnboardingSession(
  profileId: string,
  allowed: readonly TOnboardingPhase[]
): Promise<TOnboardingSession> {
  const session = await getOnboardingSession(profileId);
  if (!session) {
    throw new AppError('Onboarding session not found', ErrorCodes.ONBOARDING_SESSION_NOT_FOUND, 404);
  }

  if (!allowed.includes(session.phase)) {
    throw new AppError('This onboarding step is not available', ErrorCodes.ONBOARDING_PHASE_MISMATCH, 409);
  }

  return session;
}

async function profileManagesOrganization(profileId: string): Promise<boolean> {
  const organizations = await getOrganizationByProfileId(profileId);

  return organizations.some((entry) => entry.roleId === ROLE.ADMIN || entry.roleId === ROLE.TUTOR);
}

function isStarterJobActiveWithinContinueWindow(job: TOnboardingStarterJob | null): boolean {
  if (!job || (job.status !== 'PENDING' && job.status !== 'RUNNING')) return false;

  return Date.now() - new Date(job.createdAt).getTime() < STARTER_JOB_CONTINUE_AFTER_MS;
}

function deriveScreen(params: { phase: TOnboardingPhase; job: TOnboardingStarterJob | null }): TOnboardingScreen {
  const { phase, job } = params;

  if (phase === 'workspace') return 'business';
  if (phase === 'customise' && isStarterJobActiveWithinContinueWindow(job)) return 'preparing';

  return phase;
}

/**
 * Everything the dashboard needs to render any onboarding step and to resume after a refresh.
 * A profile that already manages an organization and has no session is reported as `complete`, so existing
 * accounts never enter the guided flow.
 */
export async function getOnboardingState(profileId: string) {
  const profile = await syncProfileEmailVerificationFromAuthUser(profileId);
  if (!profile) {
    throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
  }

  const session = await getOnboardingSession(profileId);
  const isEmailVerified = Boolean(profile.isEmailVerified);
  const aiAvailable = isOnboardingAiAvailable();

  const capabilities = { ai: aiAvailable, websiteAnalysis: aiAvailable, documentUpload: aiAvailable };

  if (!session) {
    const managesOrganization = await profileManagesOrganization(profileId);
    const screen: TOnboardingScreen = managesOrganization ? 'complete' : 'business';

    return {
      screen,
      phase: null as TOnboardingPhase | null,
      isEmailVerified,
      email: profile.email ?? '',
      fullname: profile.fullname,
      locale: profile.locale ?? 'en',
      business: {} as TOnboardingBusiness,
      brand: {} as TOnboardingBrand,
      organization: null,
      starterJobId: null as string | null,
      tour: { status: 'pending' as const, completedStepIds: [] as string[] },
      completedVia: null,
      hasSession: false,
      capabilities
    };
  }

  const organization = session.organizationId ? await getOrganizationById(session.organizationId) : null;
  const job = organization ? await getLatestStarterJob(organization.id) : null;
  const landingTheme = (organization?.landingpage as { theme?: string } | null)?.theme ?? null;

  return {
    screen: deriveScreen({ phase: session.phase, job }),
    phase: session.phase as TOnboardingPhase | null,
    isEmailVerified,
    email: profile.email ?? '',
    fullname: profile.fullname,
    locale: profile.locale ?? 'en',
    business: session.business,
    brand: session.brand,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          siteName: organization.siteName ?? '',
          avatarUrl: organization.avatarUrl,
          theme: organization.theme ?? 'blue',
          landingTheme
        }
      : null,
    starterJobId: job?.id ?? null,
    tour: {
      status: session.tour.status ?? ('pending' as const),
      completedStepIds: session.tour.completedStepIds ?? []
    },
    completedVia: session.completedVia,
    hasSession: true,
    capabilities
  };
}

/**
 * Creates the onboarding session for a new account. Idempotent. Throws ONBOARDING_NOT_AVAILABLE (409) for an
 * account that already manages an organization.
 */
export async function startOnboarding(profileId: string, input: TOnboardingStart) {
  const existing = await getOnboardingSession(profileId);
  if (existing) return getOnboardingState(profileId);

  if (await profileManagesOrganization(profileId)) {
    throw new AppError('Onboarding is only available for new accounts', ErrorCodes.ONBOARDING_NOT_AVAILABLE, 409);
  }

  await createOnboardingSession({
    profileId,
    termsAcceptedAt: input.termsAccepted ? new Date().toISOString() : null
  });

  return getOnboardingState(profileId);
}
