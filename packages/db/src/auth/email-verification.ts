import { type BetterAuthOptions } from 'better-auth';
import { buildEmailBranding, buildEmailFromName, sendEmail } from '@cio/email';
import { enqueueEmailSend } from '@cio/jobs';

import { getProfileById, markWelcomeEmailSent } from '../queries/auth/profile';
import { resolveVerificationOrg } from './resolve-verification-org';

type EmailVerificationOptions = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailVerification']>['sendVerificationEmail']>
>[0];

type ChangeEmailConfirmationOptions = Parameters<
  NonNullable<NonNullable<NonNullable<BetterAuthOptions['user']>['changeEmail']>['sendChangeEmailConfirmation']>
>[0];

export interface WelcomeEmailDependencies {
  enqueueEmailSend: typeof enqueueEmailSend;
  getProfileById: typeof getProfileById;
  markWelcomeEmailSent: typeof markWelcomeEmailSent;
}

const welcomeEmailDependencies: WelcomeEmailDependencies = {
  enqueueEmailSend,
  getProfileById,
  markWelcomeEmailSent
};

/**
 * Email verification flow.
 *
 * 1. user says I want to change my email from email@old.com to email@new.com
 * 2. we send an email to email@old.com asking user to verify if they really want to change their email to email@new.com `sendChangeEmailConfirmation()`. [better-auth].
 * 3. user clicks the link in the email
 * 4. we update the email in the database. [better-auth].
 * 5. we send a confirmation email to email@new.com `sendVerificationEmail()`. [dashboard].
 * 6. user clicks the link in the email
 * 7. we mark email@new.com as verified. [better-auth].
 */

function stripTriggerParam(url: string): string {
  return url.replace('trigger=app', '').replace('trigger%3Dapp', '');
}

/**
 * Brands verification mail with the org from `resolveVerificationOrg` (callback URL
 * host/?org=, self-hosted first org, then the user's first membership). When no
 * org applies — e.g. dashboard signup before onboarding creates an org — copy
 * and masthead fall back to ClassroomIO defaults.
 */
async function sendOrgAwareVerifyEmail(options: {
  to: string;
  verificationUrl: string;
  userId: string;
  userName?: string | null;
  newEmail?: string;
}) {
  const org = await resolveVerificationOrg({
    verificationUrl: options.verificationUrl,
    userId: options.userId
  });

  const orgName = org?.name?.trim() || 'ClassroomIO';
  const branding = buildEmailBranding(org ? { name: org.name, avatarUrl: org.avatarUrl, theme: org.theme } : undefined);

  await sendEmail('verifyEmail', {
    to: options.to,
    from: org?.name ? buildEmailFromName(`${org.name} (via ClassroomIO.com)`) : undefined,
    subject: org?.name ? `Confirm your email for ${org.name}` : undefined,
    fields: {
      link: stripTriggerParam(options.verificationUrl),
      newEmail: options.newEmail,
      userName: options.userName || undefined,
      orgName,
      branding
    }
  });
}

/**
 * Sends a verification email to the user when they sign up or change their email address.
 * @param options - The options for sending the verification email.
 * @returns The verification email.
 */
export const sendVerificationEmail = async (options: EmailVerificationOptions) => {
  const { user, url } = options;
  console.log('\nsendVerificationEmail', options);

  // The purpose of this is to prevent verification email trigger from better-auth because we already have a flow in the UI for triggering this email.
  if (!url.includes('trigger=app') && !url.includes('trigger%3Dapp')) {
    return;
  }

  await sendOrgAwareVerifyEmail({
    to: user.email,
    verificationUrl: url,
    userId: user.id,
    userName: user.name
  });
};

/**
 * Queues the account welcome email from Better Auth's successful verification
 * lifecycle. The persisted onboarding flag limits this to dashboard signups
 * and keeps profile email changes and learner verification flows from sending it.
 */
export async function sendWelcomeEmailAfterVerification(
  user: { id: string; email: string },
  _request?: Request,
  dependencies: WelcomeEmailDependencies = welcomeEmailDependencies
): Promise<void> {
  try {
    const profile = await dependencies.getProfileById(user.id);
    if (!profile || !profile.welcomeEmailPending || profile.welcomeEmailSentAt) {
      return;
    }

    await dependencies.enqueueEmailSend(
      {
        kind: 'template',
        template: 'welcome',
        to: user.email,
        fields: {
          name: profile.fullname
        }
      },
      { idempotencyKey: `onboarding:welcome:${user.id}` }
    );
    await dependencies.markWelcomeEmailSent(user.id);
  } catch (error) {
    // Verification has already succeeded at this point. Log queue failures
    // without turning a valid verification link into an error response.
    console.error('sendWelcomeEmailAfterVerification error:', error);
  }
}

/**
 * Sends a confirmation email to the user when they change their email address.
 * @param options - The options for sending the change email confirmation.
 * @returns The confirmation email.
 */
export const sendChangeEmailConfirmation = async (options: ChangeEmailConfirmationOptions) => {
  const { user, newEmail, url } = options;
  console.log('\nsendChangeEmailConfirmation', options);

  await sendOrgAwareVerifyEmail({
    to: user.email,
    verificationUrl: url,
    userId: user.id,
    userName: user.name,
    newEmail
  });
};
