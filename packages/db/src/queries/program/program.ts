import * as schema from '@db/schema';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TProgram = typeof schema.program.$inferSelect;
export type TNewProgram = typeof schema.program.$inferInsert;
export type TProgramMember = typeof schema.programMember.$inferSelect;
export type TNewProgramMember = typeof schema.programMember.$inferInsert;
export type TProgramCourse = typeof schema.programCourse.$inferSelect;
export type TProgramNewsfeed = typeof schema.programNewsfeed.$inferSelect;
export type TNewProgramNewsfeed = typeof schema.programNewsfeed.$inferInsert;
export type TProgramNewsfeedComment = typeof schema.programNewsfeedComment.$inferSelect;
export type TNewProgramNewsfeedComment = typeof schema.programNewsfeedComment.$inferInsert;

// ─── Program CRUD ────────────────────────────────────────────────────────────

export async function createProgram(data: TNewProgram): Promise<TProgram> {
  try {
    const [program] = await db.insert(schema.program).values(data).returning();
    if (!program) throw new Error('Failed to create program');
    return program;
  } catch (error) {
    console.error('createProgram error:', error);
    throw new Error(`Failed to create program: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Inserts the program and adds `creatorProfileId` as a program team member (tutor) in one transaction. */
export async function createProgramWithCreatorMembership(
  programData: TNewProgram,
  creatorProfileId: string
): Promise<TProgram> {
  try {
    return await db.transaction(async (tx) => {
      const [program] = await tx.insert(schema.program).values(programData).returning();
      if (!program) {
        throw new Error('Failed to create program');
      }

      await tx.insert(schema.programMember).values({
        programId: program.id,
        profileId: creatorProfileId,
        roleId: ROLE.TUTOR
      });

      return program;
    });
  } catch (error) {
    console.error('createProgramWithCreatorMembership error:', error);
    throw new Error(`Failed to create program: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProgramById(programId: string): Promise<TProgram | null> {
  try {
    const [program] = await db.select().from(schema.program).where(eq(schema.program.id, programId)).limit(1);
    return program || null;
  } catch (error) {
    console.error('getProgramById error:', error);
    throw new Error(
      `Failed to get program "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getProgramsByOrg(
  organizationId: string,
  programIds?: string[]
): Promise<Array<TProgram & { courseCount: number; studentCount: number }>> {
  try {
    const whereCondition =
      programIds && programIds.length > 0
        ? and(eq(schema.program.organizationId, organizationId), inArray(schema.program.id, programIds))
        : eq(schema.program.organizationId, organizationId);

    const result = await db
      .select({
        program: schema.program,
        courseCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.programCourse}
             WHERE ${eq(schema.programCourse.programId, schema.program.id)}),
            0
          )
        `.as('courseCount'),
        studentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.programMember}
             WHERE ${and(
               eq(schema.programMember.programId, schema.program.id),
               eq(schema.programMember.roleId, ROLE.STUDENT)
             )}),
            0
          )
        `.as('studentCount')
      })
      .from(schema.program)
      .where(whereCondition)
      .orderBy(desc(schema.program.createdAt));

    return result.map((row) => ({
      ...row.program,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getProgramsByOrg error:', error);
    throw new Error(
      `Failed to get programs for org "${organizationId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExistingProgramMembers(
  pairs: Array<{ programId: string; profileId: string }>
): Promise<Set<string>> {
  if (pairs.length === 0) {
    return new Set();
  }

  try {
    const programIds = [...new Set(pairs.map((pair) => pair.programId))];
    const profileIds = [...new Set(pairs.map((pair) => pair.profileId))];

    const rows = await db
      .select({ programId: schema.programMember.programId, profileId: schema.programMember.profileId })
      .from(schema.programMember)
      .where(
        and(inArray(schema.programMember.programId, programIds), inArray(schema.programMember.profileId, profileIds))
      );

    return new Set(
      rows
        .filter((row): row is { programId: string; profileId: string } => Boolean(row.programId && row.profileId))
        .map((row) => `${row.programId}:${row.profileId}`)
    );
  } catch (error) {
    console.error('getExistingProgramMembers error:', error);
    throw new Error(
      `Failed to check existing program members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateProgram(programId: string, data: Partial<TNewProgram>): Promise<TProgram | null> {
  try {
    const [updated] = await db
      .update(schema.program)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schema.program.id, programId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateProgram error:', error);
    throw new Error(
      `Failed to update program "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteProgram(programId: string): Promise<TProgram | null> {
  try {
    const [deleted] = await db.delete(schema.program).where(eq(schema.program.id, programId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteProgram error:', error);
    throw new Error(
      `Failed to delete program "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Membership ──────────────────────────────────────────────────────

export async function getProgramMemberByProfileId(
  programId: string,
  profileId: string
): Promise<TProgramMember | null> {
  try {
    const [member] = await db
      .select()
      .from(schema.programMember)
      .where(and(eq(schema.programMember.programId, programId), eq(schema.programMember.profileId, profileId)))
      .limit(1);
    return member || null;
  } catch (error) {
    console.error('getProgramMemberByProfileId error:', error);
    throw new Error(`Failed to get program member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isProgramMember(programId: string, profileId: string): Promise<boolean> {
  try {
    const member = await getProgramMemberByProfileId(programId, profileId);
    return member !== null;
  } catch (error) {
    console.error('isProgramMember error:', error);
    throw new Error(`Failed to check program membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProgramMemberRole(programId: string, profileId: string): Promise<number | null> {
  try {
    const member = await getProgramMemberByProfileId(programId, profileId);
    return member?.roleId || null;
  } catch (error) {
    console.error('getProgramMemberRole error:', error);
    throw new Error(`Failed to get program member role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isOrgAdminByProgramId(programId: string, profileId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ orgMemberId: schema.organizationmember.id })
      .from(schema.program)
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.organizationId, schema.program.organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .where(eq(schema.program.id, programId))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('isOrgAdminByProgramId error:', error);
    throw new Error(`Failed to check org admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addProgramMember(data: TNewProgramMember): Promise<TProgramMember> {
  try {
    const [member] = await db.insert(schema.programMember).values(data).returning();
    if (!member) throw new Error('Failed to add program member');
    return member;
  } catch (error) {
    console.error('addProgramMember error:', error);
    throw new Error(`Failed to add program member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeProgramMember(memberId: string): Promise<TProgramMember | null> {
  try {
    const [deleted] = await db.delete(schema.programMember).where(eq(schema.programMember.id, memberId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('removeProgramMember error:', error);
    throw new Error(
      `Failed to remove program member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateProgramMember(
  memberId: string,
  data: Partial<TNewProgramMember>
): Promise<TProgramMember | null> {
  try {
    const [updated] = await db
      .update(schema.programMember)
      .set(data)
      .where(eq(schema.programMember.id, memberId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateProgramMember error:', error);
    throw new Error(
      `Failed to update program member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getProgramMembers(programId: string): Promise<
  Array<
    TProgramMember & {
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
        member: schema.programMember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.programMember)
      .leftJoin(schema.profile, eq(schema.programMember.profileId, schema.profile.id))
      .where(eq(schema.programMember.programId, programId))
      .orderBy(asc(schema.programMember.createdAt));

    return result.map((row) => ({
      ...row.member,
      profile: row.profile?.id ? row.profile : null
    }));
  } catch (error) {
    console.error('getProgramMembers error:', error);
    throw new Error(
      `Failed to get program members for "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getEnrolledProgramsByProfile(
  profileId: string
): Promise<Array<TProgram & { roleId: number; courseCount: number; studentCount: number }>> {
  try {
    const result = await db
      .select({
        program: schema.program,
        roleId: schema.programMember.roleId,
        courseCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.programCourse}
             INNER JOIN ${schema.course}
               ON ${schema.programCourse.courseId} = ${schema.course.id}
             WHERE ${schema.programCourse.programId} = ${schema.program.id}
               AND (
                 ${schema.programMember.roleId} <> ${ROLE.STUDENT}
                 OR ${schema.course.isPublished} = true
               )),
            0
          )
        `.as('courseCount'),
        studentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.programMember} AS student_member
             WHERE student_member.program_id = ${schema.program.id}
               AND student_member.role_id = ${ROLE.STUDENT}),
            0
          )
        `.as('studentCount')
      })
      .from(schema.programMember)
      .innerJoin(schema.program, eq(schema.programMember.programId, schema.program.id))
      .where(eq(schema.programMember.profileId, profileId))
      .orderBy(desc(schema.program.createdAt));

    return result.map((row) => ({
      ...row.program,
      roleId: row.roleId,
      courseCount: Number(row.courseCount || 0),
      studentCount: Number(row.studentCount || 0)
    }));
  } catch (error) {
    console.error('getEnrolledProgramsByProfile error:', error);
    throw new Error(
      `Failed to get enrolled programs for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Courses ─────────────────────────────────────────────────────────

export async function addCourseToProgram(programId: string, courseId: string): Promise<TProgramCourse> {
  try {
    const [row] = await db.insert(schema.programCourse).values({ programId, courseId }).returning();
    if (!row) throw new Error('Failed to add course to program');
    return row;
  } catch (error) {
    console.error('addCourseToProgram error:', error);
    throw new Error(`Failed to add course to program: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeCourseFromProgram(programId: string, courseId: string): Promise<TProgramCourse | null> {
  try {
    const [deleted] = await db
      .delete(schema.programCourse)
      .where(and(eq(schema.programCourse.programId, programId), eq(schema.programCourse.courseId, courseId)))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('removeCourseFromProgram error:', error);
    throw new Error(
      `Failed to remove course from program: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCoursesByProgram(
  programId: string,
  onlyPublished = false
): Promise<
  Array<
    TProgramCourse & {
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
      ? and(eq(schema.programCourse.programId, programId), eq(schema.course.isPublished, true))
      : eq(schema.programCourse.programId, programId);

    const result = await db
      .select({
        programCourse: schema.programCourse,
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
      .from(schema.programCourse)
      .innerJoin(schema.course, eq(schema.programCourse.courseId, schema.course.id))
      .where(whereCondition)
      .orderBy(asc(schema.programCourse.addedAt));

    return result.map((row) => ({ ...row.programCourse, course: row.course }));
  } catch (error) {
    console.error('getCoursesByProgram error:', error);
    throw new Error(
      `Failed to get courses for program "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function isProgramCourse(programId: string, courseId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.programCourse.id })
      .from(schema.programCourse)
      .where(and(eq(schema.programCourse.programId, programId), eq(schema.programCourse.courseId, courseId)))
      .limit(1);
    return !!row;
  } catch (error) {
    console.error('isProgramCourse error:', error);
    throw new Error(`Failed to check program course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ─── Program Newsfeed ────────────────────────────────────────────────────────

export async function getProgramNewsfeed(
  programId: string,
  options: { cursor?: string; limit: number }
): Promise<{
  items: Array<
    TProgramNewsfeed & {
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

    const whereConditions = [eq(schema.programNewsfeed.programId, programId)];
    if (cursor) {
      whereConditions.push(sql`${schema.programNewsfeed.createdAt} < ${cursor}`);
    }

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.programNewsfeed)
      .where(eq(schema.programNewsfeed.programId, programId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const feeds = await db
      .select({
        feed: schema.programNewsfeed,
        profile: schema.profile,
        commentCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int
             FROM ${schema.programNewsfeedComment}
             WHERE ${eq(schema.programNewsfeedComment.programNewsfeedId, schema.programNewsfeed.id)}),
            0
          )
        `.as('commentCount')
      })
      .from(schema.programNewsfeed)
      .leftJoin(schema.programMember, eq(schema.programNewsfeed.authorId, schema.programMember.id))
      .leftJoin(schema.profile, eq(schema.programMember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.programNewsfeed.createdAt))
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
    console.error('getProgramNewsfeed error:', error);
    throw new Error(
      `Failed to get program newsfeed "${programId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getProgramNewsfeedById(feedId: string): Promise<TProgramNewsfeed | null> {
  try {
    const [feed] = await db.select().from(schema.programNewsfeed).where(eq(schema.programNewsfeed.id, feedId)).limit(1);
    return feed || null;
  } catch (error) {
    console.error('getProgramNewsfeedById error:', error);
    throw new Error(
      `Failed to get program newsfeed item "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createProgramNewsfeed(data: TNewProgramNewsfeed): Promise<TProgramNewsfeed> {
  try {
    const [feed] = await db.insert(schema.programNewsfeed).values(data).returning();
    if (!feed) throw new Error('Failed to create program newsfeed');
    return feed;
  } catch (error) {
    console.error('createProgramNewsfeed error:', error);
    throw new Error(`Failed to create program newsfeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateProgramNewsfeed(
  feedId: string,
  data: Partial<TNewProgramNewsfeed>
): Promise<TProgramNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.programNewsfeed)
      .set(data)
      .where(eq(schema.programNewsfeed.id, feedId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateProgramNewsfeed error:', error);
    throw new Error(
      `Failed to update program newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateProgramNewsfeedReaction(
  feedId: string,
  reaction: { clap: string[]; smile: string[]; thumbsup: string[]; thumbsdown: string[] }
): Promise<TProgramNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.programNewsfeed)
      .set({ reaction })
      .where(eq(schema.programNewsfeed.id, feedId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateProgramNewsfeedReaction error:', error);
    throw new Error(
      `Failed to update program newsfeed reaction "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteProgramNewsfeed(feedId: string): Promise<TProgramNewsfeed | null> {
  try {
    const [deleted] = await db.delete(schema.programNewsfeed).where(eq(schema.programNewsfeed.id, feedId)).returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteProgramNewsfeed error:', error);
    throw new Error(
      `Failed to delete program newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Program Newsfeed Comments ────────────────────────────────────────────────

export async function getProgramNewsfeedComments(feedId: string): Promise<
  Array<
    TProgramNewsfeedComment & {
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
        comment: schema.programNewsfeedComment,
        profile: schema.profile
      })
      .from(schema.programNewsfeedComment)
      .leftJoin(schema.programMember, eq(schema.programNewsfeedComment.authorId, schema.programMember.id))
      .leftJoin(schema.profile, eq(schema.programMember.profileId, schema.profile.id))
      .where(eq(schema.programNewsfeedComment.programNewsfeedId, feedId))
      .orderBy(asc(schema.programNewsfeedComment.createdAt));

    return result.map((row) => ({
      ...row.comment,
      authorProfileId: row.profile?.id || null,
      authorFullname: row.profile?.fullname || null,
      authorUsername: row.profile?.username || null,
      authorAvatarUrl: row.profile?.avatarUrl || null
    }));
  } catch (error) {
    console.error('getProgramNewsfeedComments error:', error);
    throw new Error(
      `Failed to get program newsfeed comments for "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createProgramNewsfeedComment(data: TNewProgramNewsfeedComment): Promise<TProgramNewsfeedComment> {
  try {
    const [comment] = await db.insert(schema.programNewsfeedComment).values(data).returning();
    if (!comment) throw new Error('Failed to create program newsfeed comment');
    return comment;
  } catch (error) {
    console.error('createProgramNewsfeedComment error:', error);
    throw new Error(
      `Failed to create program newsfeed comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteProgramNewsfeedComment(commentId: number): Promise<TProgramNewsfeedComment | null> {
  try {
    const [deleted] = await db
      .delete(schema.programNewsfeedComment)
      .where(eq(schema.programNewsfeedComment.id, commentId))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteProgramNewsfeedComment error:', error);
    throw new Error(
      `Failed to delete program newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getProgramNewsfeedCommentById(commentId: number): Promise<TProgramNewsfeedComment | null> {
  try {
    const [comment] = await db
      .select()
      .from(schema.programNewsfeedComment)
      .where(eq(schema.programNewsfeedComment.id, commentId))
      .limit(1);
    return comment || null;
  } catch (error) {
    console.error('getProgramNewsfeedCommentById error:', error);
    throw new Error(
      `Failed to get program newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
