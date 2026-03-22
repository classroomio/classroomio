import type {
  TNewOrganizationInvite,
  TNewOrganizationInviteAudit,
  TOrganizationInvite,
  TOrganizationInviteAudit
} from '@db/types';
import * as schema from '@db/schema';

import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function createOrganizationInvite(values: TNewOrganizationInvite): Promise<TOrganizationInvite> {
  try {
    const [created] = await db.insert(schema.organizationInvite).values(values).returning();

    if (!created) {
      throw new Error('Failed to create organization invite');
    }

    return created;
  } catch (error) {
    console.error('createOrganizationInvite error:', error);
    throw new Error(
      `Failed to create organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOrganizationInvites(values: TNewOrganizationInvite[]): Promise<TOrganizationInvite[]> {
  if (values.length === 0) {
    return [];
  }

  try {
    return await db.insert(schema.organizationInvite).values(values).returning();
  } catch (error) {
    console.error('createOrganizationInvites error:', error);
    throw new Error(
      `Failed to create organization invites: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('createOrganizationInviteAudit error:', error);
    throw new Error(
      `Failed to create organization invite audit event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createOrganizationInviteAudits(
  values: TNewOrganizationInviteAudit[]
): Promise<TOrganizationInviteAudit[]> {
  if (values.length === 0) {
    return [];
  }

  try {
    return await db.insert(schema.organizationInviteAudit).values(values).returning();
  } catch (error) {
    console.error('createOrganizationInviteAudits error:', error);
    throw new Error(
      `Failed to create organization invite audit events: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('revokeExistingOrganizationInvites error:', error);
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
    console.error('getOrganizationInviteByTokenHash error:', error);
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
    console.error('markOrganizationInviteAccepted error:', error);
    throw new Error(
      `Failed to mark organization invite accepted: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks whether the given email has at least one active (non-revoked,
 * non-accepted, non-expired) organization invite in the specified org.
 */
export async function hasActiveOrganizationInviteForEmail(organizationId: string, email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const [result] = await db
      .select({ id: schema.organizationInvite.id })
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          eq(schema.organizationInvite.email, normalizedEmail),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt),
          gt(schema.organizationInvite.expiresAt, sql`NOW()`)
        )
      )
      .limit(1);

    return !!result;
  } catch (error) {
    console.error('hasActiveOrganizationInviteForEmail error:', error);
    return false;
  }
}

export type TLatestOrgInviteByEmail = {
  email: string;
  acceptedAt: string | null;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
};

/**
 * Returns the latest invite per email (by created_at) for the given org and email list.
 */
export async function getLatestOrgInvitesByEmails(
  organizationId: string,
  emails: string[]
): Promise<TLatestOrgInviteByEmail[]> {
  if (emails.length === 0) {
    return [];
  }

  const normalized = [...new Set(emails.map((e) => e.toLowerCase().trim()))].filter(Boolean);
  if (normalized.length === 0) {
    return [];
  }

  try {
    const rows = await db
      .select({
        email: schema.organizationInvite.email,
        acceptedAt: schema.organizationInvite.acceptedAt,
        isRevoked: schema.organizationInvite.isRevoked,
        expiresAt: schema.organizationInvite.expiresAt,
        createdAt: schema.organizationInvite.createdAt
      })
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          inArray(schema.organizationInvite.email, normalized)
        )
      );

    const latestByEmail = new Map<string, TLatestOrgInviteByEmail>();
    for (const row of rows) {
      const key = row.email.toLowerCase();
      const existing = latestByEmail.get(key);
      if (!existing || new Date(row.createdAt) > new Date(existing.createdAt)) {
        latestByEmail.set(key, row);
      }
    }

    return Array.from(latestByEmail.values());
  } catch (error) {
    console.error('getLatestOrgInvitesByEmails error:', error);
    throw new Error(
      `Failed to get latest organization invites by emails: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Latest organization_invite row for an org + email (by created_at), for metadata when resending.
 */
export async function getLatestOrganizationInviteRowByOrgAndEmail(
  organizationId: string,
  email: string
): Promise<TOrganizationInvite | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  try {
    const [row] = await db
      .select()
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          eq(schema.organizationInvite.email, normalized)
        )
      )
      .orderBy(desc(schema.organizationInvite.createdAt))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLatestOrganizationInviteRowByOrgAndEmail error:', error);
    throw new Error(
      `Failed to get latest organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
