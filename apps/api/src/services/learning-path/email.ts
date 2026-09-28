import { enqueueTransactionalEmail } from '@api/services/jobs';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';

export type TLearningPathWelcomeEmailOrg = {
  id: string;
  name: string;
  siteName?: string | null;
  customDomain?: string | null;
  isCustomDomainVerified?: boolean | null;
  avatarUrl?: string | null;
  theme?: string | null;
};

export type TLearningPathWelcomeEmailPath = {
  id: string;
  name: string;
  publicId?: string | null;
  welcomeEmailMessage?: string | null;
};

export type TSendLearningPathWelcomeEmailInput = {
  organization: TLearningPathWelcomeEmailOrg;
  learningPath: TLearningPathWelcomeEmailPath;
  profileId: string;
  email: string;
  idempotencyKey?: string;
};

/**
 * Links directly to the learner's path hub so they land on their course
 * curriculum right after signing in. Falls back to the org root when the
 * caller's path object carries no publicId.
 */
export function buildLearningPathUrl(
  organization: TLearningPathWelcomeEmailOrg,
  learningPath: Pick<TLearningPathWelcomeEmailPath, 'publicId'>
): string {
  const baseUrl = getDashboardBaseUrl(organization);

  if (learningPath.publicId) {
    return `${baseUrl}/paths/${learningPath.publicId}`;
  }

  return baseUrl;
}

/**
 * Enqueues a student welcome email for a learning path.
 * Failures are swallowed and logged: the learner is already enrolled,
 * so an email error must never fail the enrollment flow.
 * Returns true when the enqueue succeeds, false when it fails so callers
 * can count actual deliveries instead of attempts.
 */
export async function sendLearningPathWelcomeEmail(input: TSendLearningPathWelcomeEmailInput): Promise<boolean> {
  const { organization, learningPath, profileId, email } = input;
  const loginUrl = buildLearningPathUrl(organization, learningPath);
  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
  const idempotencyKey = input.idempotencyKey ?? `learning-path-welcome:${learningPath.id}:${profileId}`;

  try {
    await enqueueTransactionalEmail('studentLearningPathWelcome', {
      to: email,
      fields: {
        orgName: organization.name,
        learningPathName: learningPath.name || 'Learning path',
        loginUrl,
        customMessage: learningPath.welcomeEmailMessage ?? undefined,
        branding
      },
      from,
      idempotencyKey,
      preference: { organizationId: organization.id, recipientProfileId: profileId }
    });

    return true;
  } catch (error) {
    console.error('sendLearningPathWelcomeEmail enqueue error', { learningPathId: learningPath.id, profileId }, error);

    return false;
  }
}

export type TSendLearningPathCompletionEmailInput = {
  organization: TLearningPathWelcomeEmailOrg;
  learningPath: TLearningPathWelcomeEmailPath;
  profileId: string;
  email: string;
  studentName: string;
  certificateAvailable: boolean;
  idempotencyKey?: string;
};

/**
 * Enqueues the completion email for a finished learning path.
 * Same swallow-and-log contract as the welcome email: completion is already
 * persisted, so delivery failure must never surface as a completion failure.
 */
export async function sendLearningPathCompletionEmail(input: TSendLearningPathCompletionEmailInput): Promise<boolean> {
  const { organization, learningPath, profileId, email, studentName, certificateAvailable } = input;
  const loginUrl = buildLearningPathUrl(organization, learningPath);
  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);
  const idempotencyKey = input.idempotencyKey ?? `learning-path-completion:${learningPath.id}:${profileId}`;

  try {
    await enqueueTransactionalEmail('studentLearningPathCompletion', {
      to: email,
      fields: {
        orgName: organization.name,
        learningPathName: learningPath.name || 'Learning path',
        studentName,
        loginUrl,
        certificateAvailable,
        branding
      },
      from,
      idempotencyKey,
      preference: { organizationId: organization.id, recipientProfileId: profileId }
    });

    return true;
  } catch (error) {
    console.error(
      'sendLearningPathCompletionEmail enqueue error',
      { learningPathId: learningPath.id, profileId },
      error
    );

    return false;
  }
}

export type TSendLearningPathInviteEmailInput = {
  organization: TLearningPathWelcomeEmailOrg;
  learningPath: TLearningPathWelcomeEmailPath;
  email: string;
  inviteLink: string;
  expiresAt: string;
  idempotencyKey: string;
};

/**
 * Enqueues a path-scoped invitation email for a learner without an account.
 * Carries the org-invite accept link (acceptance auto-enrolls the path via
 * invite metadata), framed around the learning path being offered.
 */
export async function sendLearningPathInviteEmail(input: TSendLearningPathInviteEmailInput): Promise<boolean> {
  const { organization, learningPath, email, inviteLink, expiresAt, idempotencyKey } = input;
  const branding = buildEmailBranding(organization);
  const from = buildEmailFromName(`${organization.name} (via ClassroomIO.com)`);

  try {
    await enqueueTransactionalEmail('studentLearningPathInvite', {
      to: email,
      fields: {
        email,
        orgName: organization.name,
        learningPathName: learningPath.name || 'Learning path',
        inviteLink,
        expiresAt,
        branding
      },
      from,
      idempotencyKey
    });

    return true;
  } catch (error) {
    console.error('sendLearningPathInviteEmail enqueue error', { learningPathId: learningPath.id, email }, error);

    return false;
  }
}
