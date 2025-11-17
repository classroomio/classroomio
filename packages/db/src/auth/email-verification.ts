import { type BetterAuthOptions } from 'better-auth';
import { sendEmail } from '@cio/email';

type EmailVerificationOptions = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailVerification']>['sendVerificationEmail']>
>[0];

export const sendVerificationEmail = async (options: EmailVerificationOptions) => {
  const { user, url } = options;

  await sendEmail('verifyEmail', {
    to: user.email,
    fields: {
      link: url
    }
  });
};
