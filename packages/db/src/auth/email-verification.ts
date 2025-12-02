import { type BetterAuthOptions } from 'better-auth';
import { sendEmail } from '@cio/email';

type EmailVerificationOptions = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailVerification']>['sendVerificationEmail']>
>[0];

type ChangeEmailConfirmationOptions = Parameters<
  NonNullable<NonNullable<NonNullable<BetterAuthOptions['user']>['changeEmail']>['sendChangeEmailConfirmation']>
>[0];

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

  // Remove trigger=app or trigger%3Dapp from the URL
  const link = url.replace('trigger=app', '').replace('trigger%3Dapp', '');

  await sendEmail('verifyEmail', {
    to: user.email,
    fields: {
      link,
      userName: user.name || undefined
    }
  });
};

/**
 * Sends a confirmation email to the user when they change their email address.
 * @param options - The options for sending the change email confirmation.
 * @returns The confirmation email.
 */
export const sendChangeEmailConfirmation = async (options: ChangeEmailConfirmationOptions) => {
  const { user, newEmail, url } = options;
  console.log('\nsendChangeEmailConfirmation', options);

  await sendEmail('verifyEmail', {
    to: user.email,
    fields: {
      link: url,
      newEmail,
      userName: user.name || undefined
    }
  });
};
