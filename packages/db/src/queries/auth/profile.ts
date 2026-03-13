import * as schema from '@db/schema';

import type { TProfile } from '@db/types';
import { db, type DbOrTxClient } from '@db/drizzle';
import { eq } from 'drizzle-orm';

export const getProfileById = async (id: string) => {
  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.id, id)).limit(1);

  return profile;
};

export const getProfileByEmail = async (email: string) => {
  const [profile] = await db.select().from(schema.profile).where(eq(schema.profile.email, email)).limit(1);

  return profile;
};

export const updateProfile = async (id: string, data: Partial<Omit<TProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const [updatedProfile] = await db.update(schema.profile).set(data).where(eq(schema.profile.id, id)).returning();

  return updatedProfile;
};

export const markUserAndProfileEmailVerified = async (userId: string, dbClient: DbOrTxClient = db) => {
  const verifiedAt = new Date().toISOString();

  await dbClient.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, userId));
  await dbClient
    .update(schema.profile)
    .set({ isEmailVerified: true, verifiedAt })
    .where(eq(schema.profile.id, userId));
};
