import * as schema from '@db/schema';

import { and, eq } from 'drizzle-orm';

import type { AuthMiddlewareContext } from '.';
import { db } from '@db/drizzle';

/**
 * Hook that automatically creates a profile entry when a user signs up.
 * This hook runs after user creation (email/password or OAuth signup).
 *
 * We use the profile table for everything related to the user because we heavily used supabase and supabase didn't allow you add fields to the auth.users table.
 *
 */
export const createProfileHook = async (ctx: AuthMiddlewareContext) => {
  console.debug('createProfileHook', ctx.path);
  if (!ctx.path.startsWith('/sign-up')) {
    return;
  }

  const user = ctx.context.newSession?.user;
  console.debug('user', user);

  if (!user?.id) {
    return;
  }

  const existingProfile = await db.select().from(schema.profile).where(eq(schema.profile.id, user.id)).limit(1);
  console.debug('existingProfile', existingProfile);
  if (existingProfile.length) {
    return;
  }

  const googleAccount = await db
    .select()
    .from(schema.account)
    .where(and(eq(schema.account.userId, user.id), eq(schema.account.providerId, 'google')))
    .limit(1);
  console.debug('googleAccount', googleAccount);
  const isEmailVerified = googleAccount.length > 0;
  const verifiedAt = isEmailVerified ? new Date().toISOString() : undefined;

  // Extract username from email (part before @)
  const emailMatch = user.email?.match(/^([^@]+)@/);
  const emailPrefix = emailMatch ? emailMatch[1] : 'user';
  const username = `${emailPrefix}${new Date().getTime()}`;
  const fullname = emailPrefix;

  try {
    const newProfile = await db.insert(schema.profile).values({
      id: user.id,
      username,
      fullname,
      email: user.email || undefined,
      isEmailVerified,
      verifiedAt
    });
    console.debug('newProfile', newProfile);
  } catch (error) {
    console.error('Error creating profile for user:', error);
  }
};
