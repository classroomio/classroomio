import * as schema from '@db/schema';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TOrganizationInvite } from '@db/types';

export type TLinkInviteRow = TOrganizationInvite & {
  organization: { id: string; name: string; siteName: string };
};

export async function getOrgLinkInvite(
  organizationId: string,
  roleId: number,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          eq(schema.organizationInvite.type, 'LINK'),
          eq(schema.organizationInvite.isRevoked, false),
          eq(schema.organizationInvite.roleId, roleId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getOrgLinkInvite error:', error);
    throw new Error(`Failed to get org link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createLinkInvite(
  data: {
    organizationId: string;
    roleId: number;
    tokenHash: string;
    createdByProfileId: string;
    expiresAt: string;
    metadata: Record<string, unknown>;
  },
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite> {
  try {
    const [created] = await dbClient
      .insert(schema.organizationInvite)
      .values({
        ...data,
        type: 'LINK',
        email: null,
        isRevoked: false
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create link invite');
    }

    return created;
  } catch (error) {
    console.error('createLinkInvite error:', error);
    throw new Error(`Failed to create link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function setLinkInviteRevoked(
  organizationId: string,
  roleId: number,
  isRevoked: boolean,
  profileId: string
): Promise<TOrganizationInvite | null> {
  try {
    const [invite] = await db
      .select({ id: schema.organizationInvite.id })
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          eq(schema.organizationInvite.type, 'LINK'),
          eq(schema.organizationInvite.roleId, roleId)
        )
      )
      .orderBy(desc(schema.organizationInvite.createdAt), desc(schema.organizationInvite.id))
      .limit(1);

    if (!invite) return null;

    const [updated] = await db
      .update(schema.organizationInvite)
      .set({
        isRevoked,
        revokedByProfileId: isRevoked ? profileId : null,
        revokedAt: isRevoked ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.organizationInvite.id, invite.id))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('setLinkInviteRevoked error:', error);
    throw new Error(`Failed to update link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getOrgLinkInviteWithOrg(
  dbClient: DbOrTxClient,
  tokenHash: string
): Promise<{ invite: TOrganizationInvite; organization: { id: string; name: string; siteName: string } } | null> {
  try {
    const [row] = await dbClient
      .select({
        invite: schema.organizationInvite,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName
        }
      })
      .from(schema.organizationInvite)
      .innerJoin(schema.organization, eq(schema.organizationInvite.organizationId, schema.organization.id))
      .where(and(eq(schema.organizationInvite.tokenHash, tokenHash), eq(schema.organizationInvite.type, 'LINK')))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    };
  } catch (error) {
    console.error('getOrgLinkInviteWithOrg error:', error);
    throw new Error(`Failed to load link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
