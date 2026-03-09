import * as schema from '@db/schema';

import { User } from 'better-auth';
import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';
import { hasVerifiedEmailProvider } from './create-profile';

export const syncUserWithProfile = async (user: User) => {
  console.debug('syncUserWithProfile', user);

  if (!user?.id) {
    return;
  }

  try {
    const isEmailVerified = user.emailVerified || (await hasVerifiedEmailProvider(user.id));
    await db
      .update(schema.profile)
      .set({
        email: user.email,
        isEmailVerified
      })
      .where(eq(schema.profile.id, user.id));
  } catch (error) {
    console.error('Error marking profile as verified:', error);
  }
};
