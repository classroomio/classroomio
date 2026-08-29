import * as schema from '@db/schema';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TInviteLink, TNewInviteLink } from '@db/types';

export type TInviteLinkResourceType = 'COURSE' | 'COHORT';

export type TInviteLinkTarget = {
  resourceType: TInviteLinkResourceType;
  resourceId: string;
};

function targetCondition(target: TInviteLinkTarget) {
  if (target.resourceType === 'COURSE') {
    return and(eq(schema.inviteLink.resourceType, 'COURSE'), eq(schema.inviteLink.courseId, target.resourceId));
  }

  return and(eq(schema.inviteLink.resourceType, 'COHORT'), eq(schema.inviteLink.cohortId, target.resourceId));
}

export function toInviteLinkColumns(target: TInviteLinkTarget): { courseId: string | null; cohortId: string | null } {
  if (target.resourceType === 'COURSE') {
    return { courseId: target.resourceId, cohortId: null };
  }

  return { courseId: null, cohortId: target.resourceId };
}

/** Returns the link regardless of revoked state, so a disabled link can be re-enabled. */
export async function getInviteLinkByTarget(target: TInviteLinkTarget, roleId: number): Promise<TInviteLink | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.inviteLink)
      .where(and(targetCondition(target), eq(schema.inviteLink.roleId, roleId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getInviteLinkByTarget error:', error);
    throw new Error(`Failed to get invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createInviteLink(values: TNewInviteLink): Promise<TInviteLink> {
  try {
    const conflictTarget =
      values.resourceType === 'COURSE'
        ? [schema.inviteLink.courseId, schema.inviteLink.roleId]
        : [schema.inviteLink.cohortId, schema.inviteLink.roleId];

    const [created] = await db
      .insert(schema.inviteLink)
      .values(values)
      .onConflictDoNothing({
        target: conflictTarget
      })
      .returning();

    if (created) {
      return created;
    }

    const resourceId = values.resourceType === 'COURSE' ? values.courseId : values.cohortId;
    if (!resourceId) {
      throw new Error('Invite link is missing its resource id');
    }

    const existing = await getInviteLinkByTarget(
      { resourceType: values.resourceType as TInviteLinkResourceType, resourceId },
      values.roleId
    );

    if (!existing) {
      throw new Error('Failed to create invite link');
    }

    return existing;
  } catch (error) {
    console.error('createInviteLink error:', error);
    throw new Error(`Failed to create invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function setInviteLinkRevoked(
  target: TInviteLinkTarget,
  roleId: number,
  isRevoked: boolean,
  profileId: string
): Promise<TInviteLink | null> {
  try {
    const [updated] = await db
      .update(schema.inviteLink)
      .set({
        isRevoked,
        revokedByProfileId: isRevoked ? profileId : null,
        revokedAt: isRevoked ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .where(and(targetCondition(target), eq(schema.inviteLink.roleId, roleId)))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('setInviteLinkRevoked error:', error);
    throw new Error(`Failed to update invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type TInviteLinkWithContext = {
  invite: TInviteLink;
  organization: {
    id: string;
    name: string;
    siteName: string;
    theme: string | null;
    avatarUrl: string | null;
    customDomain: string | null;
    isCustomDomainVerified: boolean | null;
  };
  course: {
    id: string;
    title: string;
    description: string | null;
    slug: string | null;
    status: string;
    isPublished: boolean;
  } | null;
  cohort: { id: string; name: string; description: string | null; coverImage: string | null; status: string } | null;
};

/** Loads a link by token hash with its org and target resource. */
export async function getInviteLinkByTokenHash(
  dbClient: DbOrTxClient,
  tokenHash: string
): Promise<TInviteLinkWithContext | null> {
  try {
    const [row] = await dbClient
      .select({
        invite: schema.inviteLink,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          theme: schema.organization.theme,
          avatarUrl: schema.organization.avatarUrl,
          customDomain: schema.organization.customDomain,
          isCustomDomainVerified: schema.organization.isCustomDomainVerified
        },
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        courseDescription: schema.course.description,
        courseSlug: schema.course.slug,
        courseStatus: schema.course.status,
        courseIsPublished: schema.course.isPublished,
        cohortId: schema.cohort.id,
        cohortName: schema.cohort.name,
        cohortDescription: schema.cohort.description,
        cohortCoverImage: schema.cohort.coverImage,
        cohortStatus: schema.cohort.status
      })
      .from(schema.inviteLink)
      .innerJoin(schema.organization, eq(schema.inviteLink.organizationId, schema.organization.id))
      .leftJoin(schema.course, eq(schema.inviteLink.courseId, schema.course.id))
      .leftJoin(schema.cohort, eq(schema.inviteLink.cohortId, schema.cohort.id))
      .where(eq(schema.inviteLink.tokenHash, tokenHash))
      .limit(1);

    if (!row) return null;

    return {
      invite: row.invite,
      organization: { ...row.organization, siteName: row.organization.siteName ?? '' },
      course: row.courseId
        ? {
            id: row.courseId,
            title: row.courseTitle ?? '',
            description: row.courseDescription ?? null,
            slug: row.courseSlug ?? null,
            status: row.courseStatus ?? '',
            isPublished: !!row.courseIsPublished
          }
        : null,
      cohort: row.cohortId
        ? {
            id: row.cohortId,
            name: row.cohortName ?? '',
            description: row.cohortDescription ?? null,
            coverImage: row.cohortCoverImage ?? null,
            status: row.cohortStatus ?? ''
          }
        : null
    };
  } catch (error) {
    console.error('getInviteLinkByTokenHash error:', error);
    throw new Error(`Failed to load invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Locks the row so a concurrent revoke cannot slip past the accept check. */
export async function lockInviteLinkForAccept(dbClient: DbOrTxClient, inviteId: string): Promise<TInviteLink | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.inviteLink)
      .where(eq(schema.inviteLink.id, inviteId))
      .limit(1)
      .for('update');

    return row ?? null;
  } catch (error) {
    console.error('lockInviteLinkForAccept error:', error);
    throw new Error(`Failed to lock invite link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Informational counter; these links have no usage cap, so it gates nothing. */
export async function incrementInviteLinkJoinCount(dbClient: DbOrTxClient, inviteId: string): Promise<void> {
  try {
    await dbClient
      .update(schema.inviteLink)
      .set({
        joinCount: sql`${schema.inviteLink.joinCount} + 1`,
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.inviteLink.id, inviteId), eq(schema.inviteLink.isRevoked, false)));
  } catch (error) {
    console.error('incrementInviteLinkJoinCount error:', error);
    throw new Error(
      `Failed to increment invite link join count: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listOrganizationInviteLinks(organizationId: string): Promise<TInviteLink[]> {
  try {
    return await db
      .select()
      .from(schema.inviteLink)
      .where(and(eq(schema.inviteLink.organizationId, organizationId), isNull(schema.inviteLink.revokedAt)));
  } catch (error) {
    console.error('listOrganizationInviteLinks error:', error);
    throw new Error(`Failed to list invite links: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
