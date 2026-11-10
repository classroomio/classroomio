import * as schema from '@db/schema';

import { db, eq } from '@db/drizzle';
import { type BetterAuthOptions } from 'better-auth';
import { sendEmail } from '@cio/email';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, hashPassword, verifyPassword } from './password';

/**
 * Configuration for the email and password options
 * @see https://www.better-auth.com/docs/authentication/email-password
 */
export const config: BetterAuthOptions['emailAndPassword'] = {
  enabled: true,
  minPasswordLength: PASSWORD_MIN_LENGTH,
  maxPasswordLength: PASSWORD_MAX_LENGTH,
  password: {
    hash: hashPassword,
    verify: ({ hash, password }) => verifyPassword(hash, password)
  },
  sendResetPassword: sendResetPassword,
  onPasswordReset: onPasswordReset
};

/**
 * Types for the email and password options
 */
type ResetPasswordOptions = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailAndPassword']>['sendResetPassword']>
>[0];
type OnPasswordResetEmail = Parameters<
  NonNullable<NonNullable<BetterAuthOptions['emailAndPassword']>['onPasswordReset']>
>[0];

async function sendResetPassword(options: ResetPasswordOptions) {
  const { user, url } = options;

  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.id, user.id)).limit(1);
  if (!profile) {
    throw new Error('Profile not found');
  }

  await sendEmail('forgotPassword', {
    to: user.email,
    fields: {
      name: profile.fullname,
      email: user.email,
      link: url
    }
  });
}

async function onPasswordReset(options: OnPasswordResetEmail) {
  const { user } = options;

  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.id, user.id)).limit(1);
  if (!profile) {
    throw new Error('Profile not found');
  }

  await sendEmail('onPasswordReset', {
    to: user.email,
    fields: {
      name: profile.fullname
    }
  });
}
