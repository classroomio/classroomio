import * as schema from '@db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export const getProfileById = async (id: string) => {
  const profile = await db.select().from(schema.profile).where(eq(schema.profile.id, id)).limit(1);

  return profile?.[0];
};
