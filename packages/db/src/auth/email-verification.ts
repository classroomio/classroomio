import { type BetterAuthOptions } from 'better-auth';
import { sendEmail } from '@cio/email';

type EmailVerificationOptions = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailVerification']>['sendVerificationEmail']>
>[0];

type ChangeEmailVerificationOptions = Parameters<
  NonNullable<NonNullable<NonNullable<BetterAuthOptions['user']>['changeEmail']>['sendChangeEmailVerification']>
>[0];

export const sendVerificationEmail = async (options: EmailVerificationOptions) => {
  const { user, url } = options;
  console.log('\nsendVerificationEmail');

  // The purpose of this is to prevent verification email trigger from better-auth because we already have a flow in the UI for triggering this email.
  if (!url.includes('trigger=app')) return;

  await sendEmail('verifyEmail', {
    to: user.email,
    fields: {
      link: url,
      userName: user.name || undefined
    }
  });
};

export const sendChangeEmailVerification = async (options: ChangeEmailVerificationOptions) => {
  const { user, newEmail, url } = options;
  console.log('\nsendChangeEmailVerification');

  await sendEmail('verifyEmail', {
    to: user.email,
    fields: {
      link: url,
      newEmail,
      userName: user.name || undefined
    }
  });
};
