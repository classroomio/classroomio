import * as schema from '@db/schema';

import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TCohort = typeof schema.cohort.$inferSelect;
export type TNewCohort = typeof schema.cohort.$inferInsert;
export type TCohortMember = typeof schema.cohortMember.$inferSelect;
export type TNewCohortMember = typeof schema.cohortMember.$inferInsert;
export type TCohortCourse = typeof schema.cohortCourse.$inferSelect;
export type TCohortNewsfeed = typeof schema.cohortNewsfeed.$inferSelect;
export type TNewCohortNewsfeed = typeof schema.cohortNewsfeed.$inferInsert;
export type TCohortNewsfeedComment = typeof schema.cohortNewsfeedComment.$inferSelect;
export type TNewCohortNewsfeedComment = typeof schema.cohortNewsfeedComment.$inferInsert;

// ─── Program CRUD ────────────────────────────────────────────────────────────

export async function createCohort(data: TNewCohort): Promise<TCohort> {
  try {
    const [cohort] = await db.insert(schema.cohort).values(data).returning();
    if (!cohort) throw new Error('Failed to create cohort');
    return cohort;
  } catch (error) {
    console.error('createCohort error:', error);
    throw new Error(`Failed to create cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Inserts the cohort and adds `creatorProfileId` as a cohort team member (tutor) in one transaction. */
export async function createCohortWithCreatorMembership(
  cohortData: TNewCohort,
  creatorProfileId: string
): Promise<TCohort> {
  try {
    return await db.transaction(async (tx) => {
      const [cohort] = await tx.insert(schema.cohort).values(cohortData).returning();
      if (!cohort) {
        throw new Error('Failed to create cohort');
      }

      await tx.insert(schema.cohortMember).values({
        cohortId: cohort.id,
        profileId: creatorProfileId,
        roleId: ROLE.TUTOR
      });

      return cohort;
    });
  } catch (error) {
    console.error('createCohortWithCreatorMembership error:', error);
    throw new Error(`Failed to create cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortById(cohortId: string): Promise<TCohort | null> {
  try {
    const [cohort] = await db.select().from(schema.cohort).where(eq(schema.cohort.id, cohortId)).limit(1);
    return cohort || null;
  } catch (error) {
    console.error('getCohortById error:', error);
    throw new Error(`Failed to get cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortsByOrg(
  organizationId: string,
  cohortIds?: string[]
): Promise<Array<TCohort & { courseCount: number; studentCount: number }>> {
  try {
    const whereCondition =
      cohortIds && cohortIds.length > 0
        ? and(eq(schema.cohort.organizationId, organizationId), inArray(schema.cohort.id, cohortIds))
        : eq(schema.cohort.organizationId, organizationId);

    const result = await db
      .select({
        cohort: schema.cohort,
        courseCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortCourse}
             WHERE ${eq(schema.cohortCourse.cohortId, schema.cohort.id)}),
            0
          )
        `.as('courseCount'),
        studentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortMember}
             WHERE ${and(
               eq(schema.cohortMember.cohortId, schema.cohort.id),
               eq(schema.cohortMember.roleId, ROLE.STUDENT)
             )}),
            0
          )
        `.as('studentCount')
      })
      .from(schema.cohort)
      .where(whereCondition)
      .orderBy(desc(schema.cohort.createdAt));

    return result.map((row) => ({
      ...row.cohort,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getCohortsByOrg error:', error);
    throw new Error(
      `Failed to get cohorts for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface TSearchOrgCohort {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string | null;
}

export async function searchOrgCohorts(orgId: string, search: string, limit: number): Promise<TSearchOrgCohort[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.cohort.id,
        name: schema.cohort.name,
        description: schema.cohort.description,
        status: schema.cohort.status,
        updatedAt: schema.cohort.updatedAt
      })
      .from(schema.cohort)
      .where(
        and(
          eq(schema.cohort.organizationId, orgId),
          eq(schema.cohort.status, 'ACTIVE'),
          or(ilike(schema.cohort.name, searchValue), ilike(schema.cohort.description, searchValue))
        )
      )
      .orderBy(desc(schema.cohort.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchOrgCohorts error:', error);
    throw new Error(`Failed to search org cohorts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchLmsCohorts(
  orgId: string,
  profileId: string,
  search: string,
  limit: number
): Promise<TSearchOrgCohort[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.cohort.id,
        name: schema.cohort.name,
        description: schema.cohort.description,
        status: schema.cohort.status,
        updatedAt: schema.cohort.updatedAt
      })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(
        and(
          eq(schema.cohortMember.profileId, profileId),
          eq(schema.cohort.organizationId, orgId),
          eq(schema.cohort.status, 'ACTIVE'),
          or(ilike(schema.cohort.name, searchValue), ilike(schema.cohort.description, searchValue))
        )
      )
      .orderBy(desc(schema.cohort.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchLmsCohorts error:', error);
    throw new Error(`Failed to search LMS cohorts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExistingCohortMembers(
  pairs: Array<{ cohortId: string; profileId: string }>
): Promise<Set<string>> {
  if (pairs.length === 0) {
    return new Set();
  }

  try {
    const cohortIds = [...new Set(pairs.map((pair) => pair.cohortId))];
    const profileIds = [...new Set(pairs.map((pair) => pair.profileId))];

    const rows = await db
      .select({ cohortId: schema.cohortMember.cohortId, profileId: schema.cohortMember.profileId })
      .from(schema.cohortMember)
      .where(and(inArray(schema.cohortMember.cohortId, cohortIds), inArray(schema.cohortMember.profileId, profileIds)));

    return new Set(
      rows
        .filter((row): row is { cohortId: string; profileId: string } => Boolean(row.cohortId && row.profileId))
        .map((row) => `${row.cohortId}:${row.profileId}`)
    );
  } catch (error) {
    console.error('getExistingCohortMembers error:', error);
    throw new Error(
      `Failed to check existing cohort members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohort(cohortId: string, data: Partial<TNewCohort>): Promise<TCohort | null> {
  try {
    const [updated] = await db
      .update(schema.cohort)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schema.cohort.id, cohortId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohort error:', error);
    throw new Error(
      `Failed to update cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohort(cohortId: string): Promise<TCohort | null> {
  try {
    const [deleted] = await db.delete(schema.cohort).where(eq(schema.cohort.id, cohortId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohort error:', error);
    throw new Error(
      `Failed to delete cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Membership ──────────────────────────────────────────────────────

export async function getCohortMemberByProfileId(cohortId: string, profileId: string): Promise<TCohortMember | null> {
  try {
    const [member] = await db
      .select()
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, cohortId), eq(schema.cohortMember.profileId, profileId)))
      .limit(1);
    return member || null;
  } catch (error) {
    console.error('getCohortMemberByProfileId error:', error);
    throw new Error(`Failed to get cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isCohortMember(cohortId: string, profileId: string): Promise<boolean> {
  try {
    const member = await getCohortMemberByProfileId(cohortId, profileId);
    return member !== null;
  } catch (error) {
    console.error('isCohortMember error:', error);
    throw new Error(`Failed to check cohort membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortMemberRole(cohortId: string, profileId: string): Promise<number | null> {
  try {
    const member = await getCohortMemberByProfileId(cohortId, profileId);
    return member?.roleId || null;
  } catch (error) {
    console.error('getCohortMemberRole error:', error);
    throw new Error(`Failed to get cohort member role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isOrgAdminByCohortId(cohortId: string, profileId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ orgMemberId: schema.organizationmember.id })
      .from(schema.cohort)
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.organizationId, schema.cohort.organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .where(eq(schema.cohort.id, cohortId))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('isOrgAdminByCohortId error:', error);
    throw new Error(`Failed to check org admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addCohortMember(data: TNewCohortMember, dbClient: DbOrTxClient = db): Promise<TCohortMember> {
  try {
    const [member] = await dbClient.insert(schema.cohortMember).values(data).returning();
    if (!member) throw new Error('Failed to add cohort member');
    return member;
  } catch (error) {
    console.error('addCohortMember error:', error);
    throw new Error(`Failed to add cohort member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeCohortMember(memberId: string): Promise<TCohortMember | null> {
  try {
    const [deleted] = await db.delete(schema.cohortMember).where(eq(schema.cohortMember.id, memberId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('removeCohortMember error:', error);
    throw new Error(
      `Failed to remove cohort member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohortMember(
  memberId: string,
  data: Partial<TNewCohortMember>
): Promise<TCohortMember | null> {
  try {
    const [updated] = await db
      .update(schema.cohortMember)
      .set(data)
      .where(eq(schema.cohortMember.id, memberId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortMember error:', error);
    throw new Error(
      `Failed to update cohort member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortMembers(cohortId: string): Promise<
  Array<
    TCohortMember & {
      profile: {
        id: string;
        fullname: string | null;
        username: string | null;
        avatarUrl: string | null;
        email: string | null;
      } | null;
    }
  >
> {
  try {
    const result = await db
      .select({
        member: schema.cohortMember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.cohortMember)
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(eq(schema.cohortMember.cohortId, cohortId))
      .orderBy(asc(schema.cohortMember.createdAt));

    return result.map((row) => ({
      ...row.member,
      profile: row.profile?.id ? row.profile : null
    }));
  } catch (error) {
    console.error('getCohortMembers error:', error);
    throw new Error(
      `Failed to get cohort members for "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getEnrolledCohortsByProfile(
  profileId: string
): Promise<Array<TCohort & { roleId: number; courseCount: number; studentCount: number }>> {
  try {
    const result = await db
      .select({
        cohort: schema.cohort,
        roleId: schema.cohortMember.roleId,
        courseCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortCourse}
             INNER JOIN ${schema.course}
               ON ${schema.cohortCourse.courseId} = ${schema.course.id}
             WHERE ${schema.cohortCourse.cohortId} = ${schema.cohort.id}
               AND (
                 ${schema.cohortMember.roleId} <> ${ROLE.STUDENT}
                 OR ${schema.course.isPublished} = true
               )),
            0
          )
        `.as('courseCount'),
        studentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortMember} AS student_member
             WHERE student_member.cohort_id = ${schema.cohort.id}
               AND student_member.role_id = ${ROLE.STUDENT}),
            0
          )
        `.as('studentCount')
      })
      .from(schema.cohortMember)
      .innerJoin(schema.cohort, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(eq(schema.cohortMember.profileId, profileId))
      .orderBy(desc(schema.cohort.createdAt));

    return result.map((row) => ({
      ...row.cohort,
      roleId: row.roleId,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getEnrolledCohortsByProfile error:', error);
    throw new Error(
      `Failed to get enrolled cohorts for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Courses ─────────────────────────────────────────────────────────

export async function addCourseToCohort(cohortId: string, courseId: string): Promise<TCohortCourse> {
  try {
    const [row] = await db.insert(schema.cohortCourse).values({ cohortId, courseId }).returning();
    if (!row) throw new Error('Failed to add course to cohort');
    return row;
  } catch (error) {
    console.error('addCourseToCohort error:', error);
    throw new Error(`Failed to add course to cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeCourseFromCohort(cohortId: string, courseId: string): Promise<TCohortCourse | null> {
  try {
    const [deleted] = await db
      .delete(schema.cohortCourse)
      .where(and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.cohortCourse.courseId, courseId)))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('removeCourseFromCohort error:', error);
    throw new Error(`Failed to remove course from cohort: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCoursesByCohort(
  cohortId: string,
  onlyPublished = false
): Promise<
  Array<
    TCohortCourse & {
      course: {
        id: string;
        title: string | null;
        description: string | null;
        coverImage: string | null;
        slug: string | null;
        status: string | null;
      };
    }
  >
> {
  try {
    const whereCondition = onlyPublished
      ? and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.course.isPublished, true))
      : eq(schema.cohortCourse.cohortId, cohortId);

    const result = await db
      .select({
        cohortCourse: schema.cohortCourse,
        course: {
          id: schema.course.id,
          title: schema.course.title,
          description: schema.course.description,
          coverImage: schema.course.logo,
          slug: schema.course.slug,
          status: schema.course.status,
          isPublished: schema.course.isPublished
        }
      })
      .from(schema.cohortCourse)
      .innerJoin(schema.course, eq(schema.cohortCourse.courseId, schema.course.id))
      .where(whereCondition)
      .orderBy(asc(schema.cohortCourse.addedAt));

    return result.map((row) => ({ ...row.cohortCourse, course: row.course }));
  } catch (error) {
    console.error('getCoursesByCohort error:', error);
    throw new Error(
      `Failed to get courses for cohort "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function isCohortCourse(cohortId: string, courseId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.cohortCourse.id })
      .from(schema.cohortCourse)
      .where(and(eq(schema.cohortCourse.cohortId, cohortId), eq(schema.cohortCourse.courseId, courseId)))
      .limit(1);
    return !!row;
  } catch (error) {
    console.error('isCohortCourse error:', error);
    throw new Error(`Failed to check cohort course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ─── Program Newsfeed ────────────────────────────────────────────────────────

export async function getCohortNewsfeed(
  cohortId: string,
  options: { cursor?: string; limit: number }
): Promise<{
  items: Array<
    TCohortNewsfeed & {
      authorProfileId: string | null;
      authorFullname: string | null;
      authorUsername: string | null;
      authorAvatarUrl: string | null;
      commentCount: number;
    }
  >;
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    const { cursor, limit } = options;

    const whereConditions = [eq(schema.cohortNewsfeed.cohortId, cohortId)];
    if (cursor) {
      whereConditions.push(sql`${schema.cohortNewsfeed.createdAt} < ${cursor}`);
    }

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.cohortNewsfeed)
      .where(eq(schema.cohortNewsfeed.cohortId, cohortId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const feeds = await db
      .select({
        feed: schema.cohortNewsfeed,
        profile: schema.profile,
        commentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.cohortNewsfeedComment}
             WHERE ${eq(schema.cohortNewsfeedComment.cohortNewsfeedId, schema.cohortNewsfeed.id)}),
            0
          )
        `.as('commentCount')
      })
      .from(schema.cohortNewsfeed)
      .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeed.authorId, schema.cohortMember.id))
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.cohortNewsfeed.createdAt))
      .limit(limit + 1);

    const hasMore = feeds.length > limit;
    const items = feeds.slice(0, limit);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].feed.createdAt : null;

    return {
      items: items.map((row) => ({
        ...row.feed,
        authorProfileId: row.profile?.id || null,
        authorFullname: row.profile?.fullname || null,
        authorUsername: row.profile?.username || null,
        authorAvatarUrl: row.profile?.avatarUrl || null,
        commentCount: Number(row.commentCount || 0)
      })),
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    console.error('getCohortNewsfeed error:', error);
    throw new Error(
      `Failed to get cohort newsfeed "${cohortId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortNewsfeedById(feedId: string): Promise<TCohortNewsfeed | null> {
  try {
    const [feed] = await db.select().from(schema.cohortNewsfeed).where(eq(schema.cohortNewsfeed.id, feedId)).limit(1);
    return feed || null;
  } catch (error) {
    console.error('getCohortNewsfeedById error:', error);
    throw new Error(
      `Failed to get cohort newsfeed item "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCohortNewsfeed(data: TNewCohortNewsfeed): Promise<TCohortNewsfeed> {
  try {
    const [feed] = await db.insert(schema.cohortNewsfeed).values(data).returning();
    if (!feed) throw new Error('Failed to create cohort newsfeed');
    return feed;
  } catch (error) {
    console.error('createCohortNewsfeed error:', error);
    throw new Error(`Failed to create cohort newsfeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateCohortNewsfeed(
  feedId: string,
  data: Partial<TNewCohortNewsfeed>
): Promise<TCohortNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.cohortNewsfeed)
      .set(data)
      .where(eq(schema.cohortNewsfeed.id, feedId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortNewsfeed error:', error);
    throw new Error(
      `Failed to update cohort newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohortNewsfeedReaction(
  feedId: string,
  reaction: { clap: string[]; smile: string[]; thumbsup: string[]; thumbsdown: string[] }
): Promise<TCohortNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.cohortNewsfeed)
      .set({ reaction })
      .where(eq(schema.cohortNewsfeed.id, feedId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateCohortNewsfeedReaction error:', error);
    throw new Error(
      `Failed to update cohort newsfeed reaction "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortNewsfeed(feedId: string): Promise<TCohortNewsfeed | null> {
  try {
    const [deleted] = await db.delete(schema.cohortNewsfeed).where(eq(schema.cohortNewsfeed.id, feedId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohortNewsfeed error:', error);
    throw new Error(
      `Failed to delete cohort newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Newsfeed Comments ────────────────────────────────────────────────

export async function getCohortNewsfeedComments(feedId: string): Promise<
  Array<
    TCohortNewsfeedComment & {
      authorProfileId: string | null;
      authorFullname: string | null;
      authorUsername: string | null;
      authorAvatarUrl: string | null;
    }
  >
> {
  try {
    const result = await db
      .select({
        comment: schema.cohortNewsfeedComment,
        profile: schema.profile
      })
      .from(schema.cohortNewsfeedComment)
      .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeedComment.authorId, schema.cohortMember.id))
      .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
      .where(eq(schema.cohortNewsfeedComment.cohortNewsfeedId, feedId))
      .orderBy(asc(schema.cohortNewsfeedComment.createdAt));

    return result.map((row) => ({
      ...row.comment,
      authorProfileId: row.profile?.id || null,
      authorFullname: row.profile?.fullname || null,
      authorUsername: row.profile?.username || null,
      authorAvatarUrl: row.profile?.avatarUrl || null
    }));
  } catch (error) {
    console.error('getCohortNewsfeedComments error:', error);
    throw new Error(
      `Failed to get cohort newsfeed comments for "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCohortNewsfeedComment(data: TNewCohortNewsfeedComment): Promise<TCohortNewsfeedComment> {
  try {
    const [comment] = await db.insert(schema.cohortNewsfeedComment).values(data).returning();
    if (!comment) throw new Error('Failed to create cohort newsfeed comment');
    return comment;
  } catch (error) {
    console.error('createCohortNewsfeedComment error:', error);
    throw new Error(
      `Failed to create cohort newsfeed comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortNewsfeedComment(commentId: number): Promise<TCohortNewsfeedComment | null> {
  try {
    const [deleted] = await db
      .delete(schema.cohortNewsfeedComment)
      .where(eq(schema.cohortNewsfeedComment.id, commentId))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteCohortNewsfeedComment error:', error);
    throw new Error(
      `Failed to delete cohort newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortNewsfeedCommentById(commentId: number): Promise<TCohortNewsfeedComment | null> {
  try {
    const [comment] = await db
      .select()
      .from(schema.cohortNewsfeedComment)
      .where(eq(schema.cohortNewsfeedComment.id, commentId))
      .limit(1);
    return comment || null;
  } catch (error) {
    console.error('getCohortNewsfeedCommentById error:', error);
    throw new Error(
      `Failed to get cohort newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
