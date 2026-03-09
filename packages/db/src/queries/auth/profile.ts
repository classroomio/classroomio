import * as schema from '@db/schema';

import type { TProfile } from '@db/types';
import { db } from '@db/drizzle';
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
