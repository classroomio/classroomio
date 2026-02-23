import * as schema from '@db/schema';

import { eq } from 'drizzle-orm';

import { db } from '@db/drizzle';
import type { TNewOrganizationTokenAuth, TOrganizationTokenAuth } from '@db/types';

/** All active token auth configs (org id + secret). For server-side verification only. */
export const getAllActiveTokenAuth = async (): Promise<{ organizationId: string; signingSecret: string }[]> => {
  try {
    const rows = await db
      .select({
        organizationId: schema.organizationTokenAuth.organizationId,
        signingSecret: schema.organizationTokenAuth.signingSecret
      })
      .from(schema.organizationTokenAuth)
      .where(eq(schema.organizationTokenAuth.isActive, true));

    return rows;
  } catch (error) {
    console.error('getAllActiveTokenAuth error:', error);
    throw new Error('Failed to get active token auth configs');
  }
};

export const getTokenAuthByOrgId = async (orgId: string): Promise<TOrganizationTokenAuth | null> => {
  try {
    const [row] = await db
      .select()
      .from(schema.organizationTokenAuth)
      .where(eq(schema.organizationTokenAuth.organizationId, orgId))
      .limit(1);

    return row || null;
  } catch (error) {
    console.error('getTokenAuthByOrgId error:', error);
    throw new Error('Failed to get token auth by org id');
  }
};

export const createTokenAuth = async (data: TNewOrganizationTokenAuth): Promise<TOrganizationTokenAuth> => {
  try {
    const [row] = await db.insert(schema.organizationTokenAuth).values(data).returning();

    if (!row) {
      throw new Error('Failed to create token auth');
    }

    return row;
  } catch (error) {
    console.error('createTokenAuth error:', error);
    throw new Error('Failed to create token auth');
  }
};

export const updateTokenAuth = async (
  orgId: string,
  data: Partial<TOrganizationTokenAuth>
): Promise<TOrganizationTokenAuth | null> => {
  try {
    const [row] = await db
      .update(schema.organizationTokenAuth)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.organizationTokenAuth.organizationId, orgId))
      .returning();

    return row || null;
  } catch (error) {
    console.error('updateTokenAuth error:', error);
    throw new Error('Failed to update token auth');
  }
};

export const deleteTokenAuth = async (orgId: string): Promise<void> => {
  try {
    await db.delete(schema.organizationTokenAuth).where(eq(schema.organizationTokenAuth.organizationId, orgId));
  } catch (error) {
    console.error('deleteTokenAuth error:', error);
    throw new Error('Failed to delete token auth');
  }
};
