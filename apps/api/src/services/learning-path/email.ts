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
 * Enqueues a student welcome email for a learning path.
 * Failures are swallowed and logged: the learner is already enrolled,
 * so an email error must never fail the enrollment flow.
 * Returns true when the enqueue succeeds, false when it fails so callers
 * can count actual deliveries instead of attempts.
 */
export async function sendLearningPathWelcomeEmail(input: TSendLearningPathWelcomeEmailInput): Promise<boolean> {
  const { organization, learningPath, profileId, email } = input;
  const loginUrl = getDashboardBaseUrl(organization);
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
