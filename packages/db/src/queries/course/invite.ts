import type { TCourseInvite, TCourseInviteAudit, TNewCourseInvite, TNewCourseInviteAudit } from '@db/types';
import * as schema from '@db/schema';

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

export async function createCourseInvite(values: TNewCourseInvite): Promise<TCourseInvite> {
  try {
    const [created] = await db.insert(schema.courseInvite).values(values).returning();

    if (!created) {
      throw new Error('Failed to create course invite');
    }

    return created;
  } catch (error) {
    console.error('createCourseInvite error:', error);
    throw new Error(`Failed to create course invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourseInviteAudit(values: TNewCourseInviteAudit): Promise<TCourseInviteAudit> {
  try {
    const [created] = await db.insert(schema.courseInviteAudit).values(values).returning();

    if (!created) {
      throw new Error('Failed to create course invite audit event');
    }

    return created;
  } catch (error) {
    console.error('createCourseInviteAudit error:', error);
    throw new Error(
      `Failed to create course invite audit event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseInviteById(courseId: string, inviteId: string): Promise<TCourseInvite | null> {
  try {
    const [invite] = await db
      .select()
      .from(schema.courseInvite)
      .where(and(eq(schema.courseInvite.id, inviteId), eq(schema.courseInvite.courseId, courseId)))
      .limit(1);

    return invite || null;
  } catch (error) {
    console.error('getCourseInviteById error:', error);
    throw new Error(`Failed to get course invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type TCourseInviteListItem = {
  id: string;
  courseId: string;
  roleId: number;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  isRevoked: boolean;
  allowedEmails: string[] | null;
  allowedDomains: string[] | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revokedByProfileId: string | null;
  createdBy: {
    id: string;
    fullname: string | null;
    email: string | null;
  } | null;
};

export type TCourseInviteAuditItem = {
  id: string;
  inviteId: string;
  courseId: string;
  eventType: (typeof schema.courseInviteEventType.enumValues)[number];
  targetEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: {
    id: string;
    fullname: string | null;
    email: string | null;
  } | null;
};

export type TCourseInviteAuditStatsRow = {
  inviteId: string;
  eventType: (typeof schema.courseInviteEventType.enumValues)[number];
  count: number;
  lastAt: string | null;
};

export async function listCourseInvites(courseId: string): Promise<TCourseInviteListItem[]> {
  try {
    const result = await db
      .select({
        invite: schema.courseInvite,
        creator: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          email: schema.profile.email
        }
      })
      .from(schema.courseInvite)
      .leftJoin(schema.profile, eq(schema.courseInvite.createdByProfileId, schema.profile.id))
      .where(eq(schema.courseInvite.courseId, courseId))
      .orderBy(desc(schema.courseInvite.createdAt));

    return result.map((row) => {
      const creator = row.creator?.id
        ? {
            id: row.creator.id,
            fullname: row.creator.fullname,
            email: row.creator.email
          }
        : null;

      return {
        id: row.invite.id,
        courseId: row.invite.courseId,
        roleId: row.invite.roleId,
        expiresAt: row.invite.expiresAt,
        maxUses: row.invite.maxUses,
        usedCount: row.invite.usedCount,
        isRevoked: row.invite.isRevoked,
        allowedEmails: row.invite.allowedEmails,
        allowedDomains: row.invite.allowedDomains,
        createdAt: row.invite.createdAt,
        updatedAt: row.invite.updatedAt,
        lastUsedAt: row.invite.lastUsedAt || null,
        revokedAt: row.invite.revokedAt || null,
        revokedByProfileId: row.invite.revokedByProfileId || null,
        createdBy: creator
      };
    });
  } catch (error) {
    console.error('listCourseInvites error:', error);
    throw new Error(`Failed to list course invites: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listCourseInviteAudit(
  courseId: string,
  inviteId: string,
  limit = 100
): Promise<TCourseInviteAuditItem[]> {
  try {
    const result = await db
      .select({
        audit: schema.courseInviteAudit,
        actor: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          email: schema.profile.email
        }
      })
      .from(schema.courseInviteAudit)
      .leftJoin(schema.profile, eq(schema.courseInviteAudit.actorProfileId, schema.profile.id))
      .where(and(eq(schema.courseInviteAudit.courseId, courseId), eq(schema.courseInviteAudit.inviteId, inviteId)))
      .orderBy(desc(schema.courseInviteAudit.createdAt))
      .limit(limit);

    return result.map((row) => ({
      id: row.audit.id,
      inviteId: row.audit.inviteId,
      courseId: row.audit.courseId,
      eventType: row.audit.eventType,
      targetEmail: row.audit.targetEmail || null,
      ipAddress: row.audit.ipAddress || null,
      userAgent: row.audit.userAgent || null,
      metadata: (row.audit.metadata as Record<string, unknown>) || {},
      createdAt: row.audit.createdAt,
      actor: row.actor?.id
        ? {
            id: row.actor.id,
            fullname: row.actor.fullname,
            email: row.actor.email
          }
        : null
    }));
  } catch (error) {
    console.error('listCourseInviteAudit error:', error);
    throw new Error(`Failed to list invite audit events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listCourseInviteAuditStats(courseId: string): Promise<TCourseInviteAuditStatsRow[]> {
  try {
    const rows = await db
      .select({
        inviteId: schema.courseInviteAudit.inviteId,
        eventType: schema.courseInviteAudit.eventType,
        count: sql<number>`count(*)::int`.as('count'),
        lastAt: sql<string | null>`max(${schema.courseInviteAudit.createdAt})`.as('last_at')
      })
      .from(schema.courseInviteAudit)
      .where(eq(schema.courseInviteAudit.courseId, courseId))
      .groupBy(schema.courseInviteAudit.inviteId, schema.courseInviteAudit.eventType);

    return rows;
  } catch (error) {
    console.error('listCourseInviteAuditStats error:', error);
    throw new Error(`Failed to list invite audit stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function countInviteDistinctPreviewIps(inviteId: string, sinceIsoDate: string): Promise<number> {
  try {
    const [row] = await db
      .select({
        count: sql<number>`count(distinct ${schema.courseInviteAudit.ipAddress})::int`.as('count')
      })
      .from(schema.courseInviteAudit)
      .where(
        and(
          eq(schema.courseInviteAudit.inviteId, inviteId),
          eq(schema.courseInviteAudit.eventType, 'PREVIEWED'),
          gte(schema.courseInviteAudit.createdAt, sinceIsoDate),
          sql`${schema.courseInviteAudit.ipAddress} is not null`
        )
      );

    return row?.count ?? 0;
  } catch (error) {
    console.error('countInviteDistinctPreviewIps error:', error);
    throw new Error(`Failed to count invite IP diversity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function revokeCourseInvite(
  courseId: string,
  inviteId: string,
  revokedByProfileId: string
): Promise<TCourseInvite | null> {
  try {
    const [updated] = await db
      .update(schema.courseInvite)
      .set({
        isRevoked: true,
        revokedAt: new Date().toISOString(),
        revokedByProfileId,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.courseInvite.id, inviteId), eq(schema.courseInvite.courseId, courseId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('revokeCourseInvite error:', error);
    throw new Error(`Failed to revoke course invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type TCourseInviteTokenData = {
  invite: TCourseInvite;
  course: {
    id: string;
    title: string;
    description: string;
    status: string;
    isPublished: boolean;
    metadata: Record<string, unknown> | null;
    groupId: string;
    slug: string | null;
    cost: number;
  };
  organization: {
    id: string;
    name: string;
    siteName: string;
    theme: string | null;
  };
};

export async function getCourseInviteByTokenHash(tokenHash: string): Promise<TCourseInviteTokenData | null> {
  try {
    const [result] = await db
      .select({
        invite: schema.courseInvite,
        course: {
          id: schema.course.id,
          title: schema.course.title,
          description: schema.course.description,
          status: schema.course.status,
          isPublished: schema.course.isPublished,
          metadata: schema.course.metadata,
          groupId: schema.group.id,
          slug: schema.course.slug,
          cost: schema.course.cost
        },
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          theme: schema.organization.theme
        }
      })
      .from(schema.courseInvite)
      .innerJoin(schema.course, eq(schema.courseInvite.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.courseInvite.tokenHash, tokenHash))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      course: {
        ...result.course,
        isPublished: !!result.course.isPublished,
        cost: Number(result.course.cost ?? 0)
      },
      organization: {
        ...result.organization,
        siteName: result.organization.siteName ?? '',
        theme: result.organization.theme ?? null
      }
    };
  } catch (error) {
    console.error('getCourseInviteByTokenHash error:', error);
    throw new Error(
      `Failed to get course invite by token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TCourseInviteAcceptBundle = {
  invite: TCourseInvite;
  course: {
    id: string;
    title: string;
    status: string;
    isPublished: boolean;
    metadata: Record<string, unknown> | null;
    groupId: string;
  };
  organization: {
    id: string;
    name: string;
    siteName: string;
    customDomain: string | null;
    isCustomDomainVerified: boolean | null;
    avatarUrl: string | null;
    theme: string | null;
  };
};

export async function selectCourseInviteAcceptBundleByTokenHash(
  dbClient: DbOrTxClient,
  tokenHash: string
): Promise<TCourseInviteAcceptBundle | null> {
  try {
    const [row] = await dbClient
      .select({
        invite: schema.courseInvite,
        course: {
          id: schema.course.id,
          title: schema.course.title,
          status: schema.course.status,
          isPublished: schema.course.isPublished,
          metadata: schema.course.metadata,
          groupId: schema.group.id
        },
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          customDomain: schema.organization.customDomain,
          isCustomDomainVerified: schema.organization.isCustomDomainVerified,
          avatarUrl: schema.organization.avatarUrl,
          theme: schema.organization.theme
        }
      })
      .from(schema.courseInvite)
      .innerJoin(schema.course, eq(schema.courseInvite.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.courseInvite.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      course: {
        ...row.course,
        isPublished: !!row.course.isPublished
      },
      organization: {
        ...row.organization,
        siteName: row.organization.siteName ?? '',
        customDomain: row.organization.customDomain ?? null,
        isCustomDomainVerified: row.organization.isCustomDomainVerified ?? null
      }
    };
  } catch (error) {
    console.error('selectCourseInviteAcceptBundleByTokenHash error:', error);
    throw new Error(
      `Failed to load course invite for accept: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function optimisticIncrementCourseInviteUsedCount(
  dbClient: DbOrTxClient,
  inviteId: string,
  priorUsedCount: number
): Promise<{ id: string } | undefined> {
  try {
    const [consumeInvite] = await dbClient
      .update(schema.courseInvite)
      .set({
        usedCount: priorUsedCount + 1,
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      })
      .where(and(eq(schema.courseInvite.id, inviteId), eq(schema.courseInvite.usedCount, priorUsedCount)))
      .returning({
        id: schema.courseInvite.id
      });

    return consumeInvite;
  } catch (error) {
    console.error('optimisticIncrementCourseInviteUsedCount error:', error);
    throw new Error(
      `Failed to update course invite usage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
