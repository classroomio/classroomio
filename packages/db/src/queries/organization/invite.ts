import type {
  TNewOrganizationInvite,
  TNewOrganizationInviteAudit,
  TOrganizationInvite,
  TOrganizationInviteAudit,
  TNewOrganizationmember
} from '@db/types';
import * as schema from '@db/schema';

import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';

export async function createOrganizationInvite(
  values: TNewOrganizationInvite,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite> {
  try {
    const [created] = await dbClient.insert(schema.organizationInvite).values(values).returning();

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

export async function createOrganizationInvites(
  values: TNewOrganizationInvite[],
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite[]> {
  if (values.length === 0) {
    return [];
  }

  try {
    return await dbClient.insert(schema.organizationInvite).values(values).returning();
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
  revokedByProfileId: string,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite[]> {
  if (emails.length === 0) {
    return [];
  }

  try {
    const updated = await dbClient
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

/**
 * Updates every unaccepted invite for this email to the given role.
 */
export async function updateActiveOrganizationInviteRoleByEmail(
  organizationId: string,
  email: string,
  roleId: number,
  dbClient: DbOrTxClient = db
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const updatedAt = new Date().toISOString();

  try {
    await dbClient
      .update(schema.organizationInvite)
      .set({
        roleId,
        updatedAt
      })
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          sql`lower(${schema.organizationInvite.email}) = ${normalizedEmail}`,
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt)
        )
      );
  } catch (error) {
    console.error('updateActiveOrganizationInviteRoleByEmail error:', error);
    throw new Error('Failed to update organization invite role');
  }
}

export type TOrganizationInviteTokenData = {
  invite: TOrganizationInvite;
  organization: {
    id: string;
    name: string;
    siteName: string;
    avatarUrl: string | null;
  };
};

/** List rows for the notification panel: the token data plus the org avatar. */
export type TPendingOrgInviteListItem = TOrganizationInviteTokenData;

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
          siteName: schema.organization.siteName,
          avatarUrl: schema.organization.avatarUrl
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
          eq(sql`lower(${schema.organizationInvite.email})`, normalizedEmail),
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
      if (!row.email) continue;

      const key = row.email.toLowerCase();
      const existing = latestByEmail.get(key);
      if (!existing || new Date(row.createdAt) > new Date(existing.createdAt)) {
        latestByEmail.set(key, { ...row, email: row.email });
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
 * Returns the latest active (non-revoked, non-accepted, non-expired) org invite for a given org+email.
 * Used to surface a pending invite to a logged-in student on the LMS dashboard.
 */
/**
 * Active pending org invites for an email across every organization. Unlike
 * `getActivePendingOrgInviteForEmail` this is not scoped to one org, so it can surface an
 * invite to an org the user is not currently viewing.
 */
export async function getActivePendingOrgInvitesForEmail(email: string): Promise<TPendingOrgInviteListItem[]> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return [];
  }

  try {
    const rows = await db
      .select({
        invite: schema.organizationInvite,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          avatarUrl: schema.organization.avatarUrl
        }
      })
      .from(schema.organizationInvite)
      .innerJoin(schema.organization, eq(schema.organizationInvite.organizationId, schema.organization.id))
      .where(
        and(
          eq(sql`lower(${schema.organizationInvite.email})`, normalized),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt),
          gt(schema.organizationInvite.expiresAt, sql`NOW()`)
        )
      )
      .orderBy(desc(schema.organizationInvite.createdAt));

    return rows.map((row) => ({
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    }));
  } catch (error) {
    console.error('getActivePendingOrgInvitesForEmail error:', error);
    throw new Error(
      `Failed to get active pending org invites: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getActivePendingOrgInviteForEmail(
  organizationId: string,
  email: string
): Promise<{ invite: TOrganizationInvite; organization: { id: string; name: string; siteName: string } } | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  try {
    const [row] = await db
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
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          eq(sql`lower(${schema.organizationInvite.email})`, normalized),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt),
          gt(schema.organizationInvite.expiresAt, sql`NOW()`)
        )
      )
      .orderBy(desc(schema.organizationInvite.createdAt))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    };
  } catch (error) {
    console.error('getActivePendingOrgInviteForEmail error:', error);
    throw new Error(
      `Failed to get active pending org invite: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          eq(sql`lower(${schema.organizationInvite.email})`, normalized)
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

/**
 * The metadata of the latest invite of any status (including revoked) for each email in the organization, newest by
 * created_at. Emails without an invite are absent from the result.
 */
export async function getLatestOrganizationInviteMetadataByEmails(
  organizationId: string,
  emails: string[],
  dbClient: DbOrTxClient = db
): Promise<{ email: string; metadata: unknown }[]> {
  const normalized = [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return [];
  }

  try {
    const rows = await dbClient
      .selectDistinctOn([schema.organizationInvite.email], {
        email: schema.organizationInvite.email,
        metadata: schema.organizationInvite.metadata
      })
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          inArray(schema.organizationInvite.email, normalized)
        )
      )
      .orderBy(schema.organizationInvite.email, desc(schema.organizationInvite.createdAt));

    return rows.flatMap((row) => (row.email ? [{ email: row.email, metadata: row.metadata }] : []));
  } catch (error) {
    console.error('getLatestOrganizationInviteMetadataByEmails error:', error);
    throw new Error('Failed to get latest organization invites');
  }
}

export type TOrganizationInviteAcceptRow = {
  invite: TOrganizationInvite;
  organization: {
    id: string;
    name: string;
    siteName: string;
  };
};

export async function selectOrganizationInviteWithOrgByTokenHash(
  dbClient: DbOrTxClient,
  tokenHash: string
): Promise<TOrganizationInviteAcceptRow | null> {
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
      .where(eq(schema.organizationInvite.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    };
  } catch (error) {
    console.error('selectOrganizationInviteWithOrgByTokenHash error:', error);
    throw new Error(`Failed to load organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function selectOrganizationInviteWithOrgByInviteId(
  dbClient: DbOrTxClient,
  inviteId: string
): Promise<TOrganizationInviteAcceptRow | null> {
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
      .where(eq(schema.organizationInvite.id, inviteId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    };
  } catch (error) {
    console.error('selectOrganizationInviteWithOrgByInviteId error:', error);
    throw new Error(`Failed to load organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function selectOrganizationMemberByOrgAndNormalizedEmail(
  dbClient: DbOrTxClient,
  organizationId: string,
  normalizedEmail: string
) {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(sql`lower(${schema.organizationmember.email})`, normalizedEmail.trim().toLowerCase())
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('selectOrganizationMemberByOrgAndNormalizedEmail error:', error);
    throw new Error(`Failed to load organization member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function selectOrganizationMemberByOrgAndProfile(
  dbClient: DbOrTxClient,
  organizationId: string,
  profileId: string
) {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.profileId, profileId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('selectOrganizationMemberByOrgAndProfile error:', error);
    throw new Error(`Failed to load organization member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateOrganizationMemberById(
  dbClient: DbOrTxClient,
  memberId: number,
  data: Partial<TNewOrganizationmember>
) {
  try {
    const [updated] = await dbClient
      .update(schema.organizationmember)
      .set(data)
      .where(eq(schema.organizationmember.id, memberId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateOrganizationMemberById error:', error);
    throw new Error(
      `Failed to update organization member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function claimPendingOrganizationInvite(
  dbClient: DbOrTxClient,
  inviteId: string,
  acceptedByProfileId: string
): Promise<{ id: string } | undefined> {
  try {
    const [acceptedInvite] = await dbClient
      .update(schema.organizationInvite)
      .set({
        acceptedAt: new Date().toISOString(),
        acceptedByProfileId,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.organizationInvite.id, inviteId),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt)
        )
      )
      .returning({
        id: schema.organizationInvite.id
      });

    return acceptedInvite;
  } catch (error) {
    console.error('claimPendingOrganizationInvite error:', error);
    throw new Error(
      `Failed to finalize organization invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Live STUDENT org invites for an (org, email): not revoked, not accepted, not expired.
 * Staff invites are never returned; fulfilment must not auto-accept privilege.
 */
export async function listLiveStudentOrgInvitesForEmail(
  orgId: string,
  email: string,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite[]> {
  const normalized = email.trim().toLowerCase();
  if (!orgId || !normalized) return [];

  try {
    return await dbClient
      .select()
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, orgId),
          eq(sql`lower(${schema.organizationInvite.email})`, normalized),
          eq(schema.organizationInvite.roleId, ROLE.STUDENT),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt),
          gt(schema.organizationInvite.expiresAt, sql`NOW()`)
        )
      )
      .orderBy(desc(schema.organizationInvite.createdAt));
  } catch (error) {
    console.error('listLiveStudentOrgInvitesForEmail error:', error);
    throw new Error(
      `Failed to list live student org invites: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Serializes membership and invitation writes for one (organization, email) until the transaction ends.
 */
export async function lockOrganizationMemberEmail(
  dbClient: DbOrTxClient,
  organizationId: string,
  normalizedEmail: string
): Promise<void> {
  try {
    await dbClient.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${normalizedEmail}`}, 0))`
    );
  } catch (error) {
    console.error('lockOrganizationMemberEmail error:', error);
    throw new Error(
      `Failed to lock organization member email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOrganizationMemberById(dbClient: DbOrTxClient, memberId: number): Promise<void> {
  try {
    await dbClient.delete(schema.organizationmember).where(eq(schema.organizationmember.id, memberId));
  } catch (error) {
    console.error('deleteOrganizationMemberById error:', error);
    throw new Error(
      `Failed to delete organization member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Emails among `normalizedEmails` that belong to an ADMIN/TUTOR member of the organization or hold a live staff
 * invite there.
 */
export async function getStaffEmailsInOrganization(
  organizationId: string,
  normalizedEmails: string[],
  dbClient: DbOrTxClient = db
): Promise<Set<string>> {
  if (normalizedEmails.length === 0) return new Set();

  try {
    const [staffMembers, staffInvites] = await Promise.all([
      dbClient
        .select({ email: schema.organizationmember.email })
        .from(schema.organizationmember)
        .where(
          and(
            eq(schema.organizationmember.organizationId, organizationId),
            inArray(sql`lower(${schema.organizationmember.email})`, normalizedEmails),
            inArray(schema.organizationmember.roleId, [ROLE.ADMIN, ROLE.TUTOR])
          )
        ),
      dbClient
        .select({ email: schema.organizationInvite.email })
        .from(schema.organizationInvite)
        .where(
          and(
            eq(schema.organizationInvite.organizationId, organizationId),
            inArray(sql`lower(${schema.organizationInvite.email})`, normalizedEmails),
            inArray(schema.organizationInvite.roleId, [ROLE.ADMIN, ROLE.TUTOR]),
            eq(schema.organizationInvite.isRevoked, false),
            isNull(schema.organizationInvite.acceptedAt),
            gt(schema.organizationInvite.expiresAt, sql`NOW()`)
          )
        )
    ]);

    return new Set(
      [...staffMembers, ...staffInvites].flatMap((row) => (row.email ? [row.email.trim().toLowerCase()] : []))
    );
  } catch (error) {
    console.error('getStaffEmailsInOrganization error:', error);
    throw new Error(`Failed to resolve staff emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Records that `inviteIds` were replaced by `supersededBy`, so their tokens can resolve to the live successor.
 */
export async function markOrganizationInvitesSuperseded(
  dbClient: DbOrTxClient,
  inviteIds: string[],
  supersededBy: string
): Promise<void> {
  if (inviteIds.length === 0) return;

  try {
    await dbClient
      .update(schema.organizationInvite)
      .set({
        metadata: sql`coalesce(${schema.organizationInvite.metadata}, '{}'::jsonb) || ${JSON.stringify({ supersededBy })}::jsonb`
      })
      .where(inArray(schema.organizationInvite.id, inviteIds));
  } catch (error) {
    console.error('markOrganizationInvitesSuperseded error:', error);
    throw new Error(
      `Failed to mark organization invites superseded: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * The newest live STUDENT invite for (organization, email), or null.
 */
export async function getLiveStudentOrgInviteForEmail(
  organizationId: string,
  normalizedEmail: string,
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite | null> {
  const [invite] = await listLiveStudentOrgInvitesForEmail(organizationId, normalizedEmail, dbClient);

  return invite ?? null;
}

/**
 * The latest invite for each email in the organization, whatever its status, with the fields needed to tell a
 * renewal (expired) from an admin revocation.
 */
export async function getLatestOrganizationInviteRowsByEmails(
  organizationId: string,
  normalizedEmails: string[],
  dbClient: DbOrTxClient = db
): Promise<TOrganizationInvite[]> {
  if (normalizedEmails.length === 0) return [];

  try {
    return await dbClient
      .selectDistinctOn([schema.organizationInvite.email])
      .from(schema.organizationInvite)
      .where(
        and(
          eq(schema.organizationInvite.organizationId, organizationId),
          inArray(schema.organizationInvite.email, normalizedEmails)
        )
      )
      .orderBy(schema.organizationInvite.email, desc(schema.organizationInvite.createdAt));
  } catch (error) {
    console.error('getLatestOrganizationInviteRowsByEmails error:', error);
    throw new Error(
      `Failed to get latest organization invites: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * True when an `EMAIL_SENT` audit row exists for the organization invite.
 */
export async function hasOrganizationInviteEmailBeenSent(
  inviteId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.organizationInviteAudit.id })
      .from(schema.organizationInviteAudit)
      .where(
        and(
          eq(schema.organizationInviteAudit.inviteId, inviteId),
          eq(schema.organizationInviteAudit.eventType, 'EMAIL_SENT')
        )
      )
      .limit(1);

    return !!row;
  } catch (error) {
    console.error('hasOrganizationInviteEmailBeenSent error:', error);
    throw new Error(
      `Failed to check organization invite email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
