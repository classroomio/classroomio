import type {
  TNewOrganizationInvite,
  TNewOrganizationInviteAudit,
  TOrganizationInvite,
  TOrganizationInviteAudit
} from '@db/types';
import * as schema from '@db/schema';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function createOrganizationInvite(values: TNewOrganizationInvite): Promise<TOrganizationInvite> {
  try {
    const [created] = await db.insert(schema.organizationInvite).values(values).returning();

    if (!created) {
      throw new Error('Failed to create organization invite');
    }

    return created;
  } catch (error) {
    throw new Error(
      `Failed to create organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOrganizationInviteAudit(
  values: TNewOrganizationInviteAudit
): Promise<TOrganizationInviteAudit> {
  try {
    const [created] = await db.insert(schema.organizationInviteAudit).values(values).returning();

    if (!created) {
      throw new Error('Failed to create organization invite audit event');
    }

    return created;
  } catch (error) {
    throw new Error(
      `Failed to create organization invite audit event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function revokeActiveOrganizationInvitesByEmails(
  organizationId: string,
  emails: string[],
  revokedByProfileId: string
): Promise<TOrganizationInvite[]> {
  if (emails.length === 0) {
    return [];
  }

  try {
    const updated = await db
      .update(schema.organizationInvite)
      .set({
        isRevoked: true,
        revokedByProfileId,
        revokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          inArray(schema.organizationInvite.email, emails),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt)
        )
      )
      .returning();

    return updated;
  } catch (error) {
    throw new Error(
      `Failed to revoke existing organization invites: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TOrganizationInviteTokenData = {
  invite: TOrganizationInvite;
  organization: {
    id: string;
    name: string;
    siteName: string;
  };
};

export async function getOrganizationInviteByTokenHash(
  tokenHash: string
): Promise<TOrganizationInviteTokenData | null> {
  try {
    const [result] = await db
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
      .where(eq(schema.organizationInvite.tokenHash, tokenHash))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      organization: {
        ...result.organization,
        siteName: result.organization.siteName ?? ''
      }
    };
  } catch (error) {
    throw new Error(
      `Failed to get organization invite by token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function markOrganizationInviteAccepted(
  inviteId: string,
  profileId: string
): Promise<TOrganizationInvite | null> {
  try {
    const [updated] = await db
      .update(schema.organizationInvite)
      .set({
        acceptedAt: new Date().toISOString(),
        acceptedByProfileId: profileId,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.organizationInvite.id, inviteId), isNull(schema.organizationInvite.acceptedAt)))
      .returning();

    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to mark organization invite accepted: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
