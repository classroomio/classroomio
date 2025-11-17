import * as schema from '@db/schema';

import { User } from 'better-auth';
import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';

export const markProfileAsVerified = async (user: User) => {
  console.debug('markProfileAsVerified');

  if (!user?.id || !user.emailVerified) {
    return;
  }

  try {
    // update profile and mark as verified
    await db
      .update(schema.profile)
      .set({
        isEmailVerified: user.emailVerified,
        verifiedAt: new Date().toISOString()
      })
      .where(eq(schema.profile.id, user.id));
  } catch (error) {
    console.error('Error marking profile as verified:', error);
  }
};
