import * as schema from '@db/schema';

import { and, eq, isNull } from 'drizzle-orm';

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

export const getTokenAuthIdentityUserId = async (orgId: string, externalSubject: string): Promise<string | null> => {
  const [row] = await db
    .select({ userId: schema.organizationTokenAuthIdentity.userId })
    .from(schema.organizationTokenAuthIdentity)
    .where(
      and(
        eq(schema.organizationTokenAuthIdentity.organizationId, orgId),
        eq(schema.organizationTokenAuthIdentity.externalSubject, externalSubject)
      )
    )
    .limit(1);

  return row?.userId ?? null;
};

/** Binds this org's `sub` to a user on first sign-in. No-ops if the binding already exists. */
export const linkTokenAuthIdentity = async (orgId: string, externalSubject: string, userId: string): Promise<void> => {
  await db
    .insert(schema.organizationTokenAuthIdentity)
    .values({ organizationId: orgId, externalSubject, userId })
    .onConflictDoNothing({
      target: [
        schema.organizationTokenAuthIdentity.organizationId,
        schema.organizationTokenAuthIdentity.externalSubject
      ]
    });
};

/**
 * True when the email already belongs to this org: an active or pre-created member row, or a pending invite.
 * Token exchange uses this to decide whether an existing account may be signed in by an org that hasn't seen it before.
 */
export const isEmailKnownToOrg = async (orgId: string, emailLower: string, userId: string): Promise<boolean> => {
  const [memberByProfile] = await db
    .select({ id: schema.organizationmember.id })
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.profileId, userId)))
    .limit(1);

  if (memberByProfile) return true;

  const [memberByEmail] = await db
    .select({ id: schema.organizationmember.id })
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.email, emailLower)))
    .limit(1);

  if (memberByEmail) return true;

  const [invite] = await db
    .select({ id: schema.organizationInvite.id })
    .from(schema.organizationInvite)
    .where(
      and(
        eq(schema.organizationInvite.organizationId, orgId),
        eq(schema.organizationInvite.email, emailLower),
        eq(schema.organizationInvite.isRevoked, false),
        isNull(schema.organizationInvite.acceptedAt)
      )
    )
    .limit(1);

  return Boolean(invite);
};
