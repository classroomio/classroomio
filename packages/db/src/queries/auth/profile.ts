import * as schema from '@db/schema';

import type { TProfile } from '@db/types';
import { db, type DbOrTxClient } from '@db/drizzle';
import { and, eq, inArray, ne } from 'drizzle-orm';

/**
 * True when the auth user has any non-credential account (OAuth/SSO). Those providers verify email.
 */
export async function hasVerifiedEmailProvider(userId: string, dbClient: DbOrTxClient = db): Promise<boolean> {
  const accounts = await dbClient
    .select({ providerId: schema.account.providerId })
    .from(schema.account)
    .where(and(eq(schema.account.userId, userId), ne(schema.account.providerId, 'credential')))
    .limit(1);

  return accounts.length > 0;
}

async function resolveAuthUserEmailVerified(
  userId: string,
  emailVerified: boolean,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  if (emailVerified) {
    return true;
  }

  return hasVerifiedEmailProvider(userId, dbClient);
}

/**
 * Keeps profile.is_email_verified in sync with auth user + linked OAuth/SSO accounts.
 * Repairs legacy rows where user.email_verified is true but profile.is_email_verified is false.
 * Never demotes profile.is_email_verified — some flows verify the profile before user.email_verified is set.
 */
export async function syncProfileEmailVerificationFromAuthUser(userId: string, dbClient: DbOrTxClient = db) {
  try {
    const [user] = await dbClient.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
    if (!user) {
      return null;
    }

    const [profile] = await dbClient.select().from(schema.profile).where(eq(schema.profile.id, userId)).limit(1);
    if (!profile) {
      return null;
    }

    const authSaysVerified = await resolveAuthUserEmailVerified(userId, user.emailVerified, dbClient);
    // Only promote verification — never demote. Profile can be verified via
    // self-hosted first signup, invites, or other flows before user.email_verified catches up.
    const isEmailVerified = profile.isEmailVerified || authSaysVerified;
    const emailChanged = profile.email !== user.email;
    const verificationChanged = profile.isEmailVerified !== isEmailVerified;

    if (!emailChanged && !verificationChanged) {
      return profile;
    }

    const patch: Partial<TProfile> = {
      email: user.email,
      isEmailVerified
    };

    if (isEmailVerified && !profile.isEmailVerified) {
      patch.verifiedAt = new Date().toISOString();
    }

    const [updatedProfile] = await dbClient
      .update(schema.profile)
      .set(patch)
      .where(eq(schema.profile.id, userId))
      .returning();

    return updatedProfile ?? profile;
  } catch (error) {
    console.error('syncProfileEmailVerificationFromAuthUser error:', error);
    throw new Error('Failed to sync profile email verification');
  }
}

export const getProfileById = async (id: string) => {
  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.id, id)).limit(1);

  return profile;
};

export const getProfileByEmail = async (email: string) => {
  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.email, email)).limit(1);

  return profile;
};

export async function getProfilesByEmails(emails: string[]) {
  if (emails.length === 0) return [];

  return db.select().from(schema.profile).where(inArray(schema.profile.email, emails));
}

export const updateProfile = async (id: string, data: Partial<Omit<TProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const [updatedProfile] = await db.update(schema.profile).set(data).where(eq(schema.profile.id, id)).returning();

  return updatedProfile;
};

export const markUserAndProfileEmailVerified = async (userId: string, dbClient: DbOrTxClient = db) => {
  const verifiedAt = new Date().toISOString();

  await dbClient.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, userId));
  await dbClient.update(schema.profile).set({ isEmailVerified: true, verifiedAt }).where(eq(schema.profile.id, userId));
};
