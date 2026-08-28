import * as schema from '@db/schema';

import { and, eq, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCohortInvite } from '@db/types';

export type TCohortLinkInviteWithCohort = {
  invite: TCohortInvite;
  cohort: { id: string; name: string; description: string | null; coverImage: string | null; status: string };
  organization: { id: string; name: string; siteName: string; theme: string | null; avatarUrl: string | null };
};

/**
 * Returns the cohort's share link regardless of revoked state, so the settings UI
 * can show a disabled link and re-enable it instead of minting a duplicate.
 */
export async function getCohortLinkInvite(cohortId: string): Promise<TCohortInvite | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.cohortInvite)
      .where(eq(schema.cohortInvite.cohortId, cohortId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCohortLinkInvite error:', error);
    throw new Error(`Failed to get cohort link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCohortLinkInvite(data: {
  cohortId: string;
  roleId: number;
  token: string;
  tokenHash: string;
  createdByProfileId: string;
}): Promise<TCohortInvite> {
  try {
    const [created] = await db
      .insert(schema.cohortInvite)
      .values({ ...data, isRevoked: false })
      .onConflictDoNothing({ target: schema.cohortInvite.cohortId })
      .returning();

    if (created) {
      return created;
    }

    // Another request created the link first — the unique constraint on cohort_id
    // means the existing row is the one to return.
    const existing = await getCohortLinkInvite(data.cohortId);
    if (!existing) {
      throw new Error('Failed to create cohort link invite');
    }

    return existing;
  } catch (error) {
    console.error('createCohortLinkInvite error:', error);
    throw new Error(`Failed to create cohort link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function setCohortLinkInviteRevoked(
  cohortId: string,
  isRevoked: boolean,
  profileId: string
): Promise<TCohortInvite | null> {
  try {
    const [updated] = await db
      .update(schema.cohortInvite)
      .set({
        isRevoked,
        revokedByProfileId: isRevoked ? profileId : null,
        revokedAt: isRevoked ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.cohortInvite.cohortId, cohortId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('setCohortLinkInviteRevoked error:', error);
    throw new Error(`Failed to update cohort link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortLinkInviteWithCohort(
  dbClient: DbOrTxClient,
  tokenHash: string
): Promise<TCohortLinkInviteWithCohort | null> {
  try {
    const [row] = await dbClient
      .select({
        invite: schema.cohortInvite,
        cohort: {
          id: schema.cohort.id,
          name: schema.cohort.name,
          description: schema.cohort.description,
          coverImage: schema.cohort.coverImage,
          status: schema.cohort.status
        },
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          theme: schema.organization.theme,
          avatarUrl: schema.organization.avatarUrl
        }
      })
      .from(schema.cohortInvite)
      .innerJoin(schema.cohort, eq(schema.cohortInvite.cohortId, schema.cohort.id))
      .innerJoin(schema.organization, eq(schema.cohort.organizationId, schema.organization.id))
      .where(eq(schema.cohortInvite.tokenHash, tokenHash))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' }
    };
  } catch (error) {
    console.error('getCohortLinkInviteWithCohort error:', error);
    throw new Error(`Failed to load cohort link invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Bumps the join counter after a successful join. Purely informational — the link
 * has no usage cap, so this never gates access and needs no compare-and-swap.
 */
export async function incrementCohortInviteJoinCount(dbClient: DbOrTxClient, inviteId: string): Promise<void> {
  try {
    await dbClient
      .update(schema.cohortInvite)
      .set({
        joinCount: sql`${schema.cohortInvite.joinCount} + 1`,
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.cohortInvite.id, inviteId), eq(schema.cohortInvite.isRevoked, false)));
  } catch (error) {
    console.error('incrementCohortInviteJoinCount error:', error);
    throw new Error(
      `Failed to increment cohort invite join count: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
