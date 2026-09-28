import * as schema from '@db/schema';

import { TGroupmember, TNewGroupmember } from '@db/types';
import { and, asc, count, eq, ilike, isNull, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

export type CourseMemberWithProfile = TGroupmember & {
  profile: {
    id: string;
    fullname: string | null;
    username: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
  /** Latest non-revoked grant source for this membership, if the grant ledger has one. */
  enrollmentSource: string | null;
  /** Learning path id when the latest grant came from one, for team deep-links. */
  enrollmentSourcePathId: string | null;
};

export interface PaginatedCourseMembersOptions {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
}

export interface PaginatedCourseMembersResult {
  items: CourseMemberWithProfile[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function mapCourseMemberRows(
  rows: Array<{
    member: TGroupmember;
    profile: CourseMemberWithProfile['profile'];
    enrollmentSource: string | null;
    enrollmentSourcePathId: string | null;
  }>
): CourseMemberWithProfile[] {
  return rows.map((row) => ({
    ...row.member,
    profile: row.profile || null,
    enrollmentSource: row.enrollmentSource,
    enrollmentSourcePathId: row.enrollmentSourcePathId
  }));
}

/**
 * Latest non-revoked grant provenance for one course membership, for People
 * views that show whether a learner arrived directly, via cohort, or via a
 * learning path. Null when the grant ledger has no row (pre-ledger rows).
 */
function latestGrantSourceColumns(courseId: string) {
  return {
    enrollmentSource: sql<string | null>`(
      SELECT ceg.source
      FROM ${schema.courseEnrollmentGrant} ceg
      WHERE ceg.groupmember_id = ${schema.groupmember.id}
        AND ceg.course_id = ${courseId}
        AND ceg.revoked_at IS NULL
      ORDER BY ceg.granted_at DESC
      LIMIT 1
    )`.as('enrollmentSource'),
    enrollmentSourcePathId: sql<string | null>`(
      SELECT ceg.learning_path_id
      FROM ${schema.courseEnrollmentGrant} ceg
      WHERE ceg.groupmember_id = ${schema.groupmember.id}
        AND ceg.course_id = ${courseId}
        AND ceg.revoked_at IS NULL
      ORDER BY ceg.granted_at DESC
      LIMIT 1
    )`.as('enrollmentSourcePathId')
  };
}

/**
 * Returns the enrollment source for a given groupmember/course pair.
 * Used by People views to show "Direct", "Learning Path", "Cohort", etc.
 */
export async function getEnrollmentSource(
  groupmemberId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await dbClient
      .select({ source: schema.courseEnrollmentGrant.source })
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId),
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      )
      .orderBy(sql`${schema.courseEnrollmentGrant.grantedAt} DESC`)
      .limit(1);

    return (row?.source as string | null) ?? null;
  } catch (error) {
    console.error('getEnrollmentSource error:', error);
    throw new Error(
      `Failed to get enrollment source for member "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets all course members (people) for a course
 * Returns members with their profile information
 * @param courseId Course ID
 * @returns Array of course members with profile data
 */
export async function getCourseMembers(courseId: string): Promise<CourseMemberWithProfile[]> {
  try {
    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        },
        ...latestGrantSourceColumns(courseId)
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.course.id, courseId));

    return mapCourseMemberRows(result);
  } catch (error) {
    console.error('getCourseMembers error:', error);
    throw new Error(`Failed to get course members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets one filtered page of course members with profile data.
 */
export async function getPaginatedCourseMembers(
  courseId: string,
  { page, limit, search, roleId }: PaginatedCourseMembersOptions
): Promise<PaginatedCourseMembersResult> {
  try {
    const conditions = [eq(schema.course.id, courseId)];

    if (roleId) {
      conditions.push(eq(schema.groupmember.roleId, roleId));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(schema.profile.fullname, searchPattern),
        ilike(schema.profile.email, searchPattern),
        ilike(schema.groupmember.email, searchPattern)
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const [countRow] = await db
      .select({ count: count(schema.groupmember.id) })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...conditions));

    const total = Number(countRow?.count ?? 0);
    const rows = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        },
        ...latestGrantSourceColumns(courseId)
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...conditions))
      .orderBy(asc(schema.groupmember.roleId), asc(schema.groupmember.createdAt), asc(schema.groupmember.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      items: mapCourseMemberRows(rows),
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('getPaginatedCourseMembers error:', error);
    throw new Error(
      `Failed to get paginated course members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets a course member by ID
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Course member with profile data or null if not found
 */
export async function getCourseMember(courseId: string, memberId: string): Promise<CourseMemberWithProfile | null> {
  try {
    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        },
        ...latestGrantSourceColumns(courseId)
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.id, memberId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0].member,
      profile: result[0].profile || null,
      enrollmentSource: result[0].enrollmentSource,
      enrollmentSourcePathId: result[0].enrollmentSourcePathId
    };
  } catch (error) {
    console.error('getCourseMember error:', error);
    throw new Error(`Failed to get course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the group ID for a course
 * @param courseId Course ID
 * @returns Group ID or null if not found
 */
export async function getCourseGroupId(courseId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ groupId: schema.course.groupId })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return result.length > 0 ? result[0].groupId : null;
  } catch (error) {
    console.error('getCourseGroupId error:', error);
    throw new Error(`Failed to get course group ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets teachers (ADMIN or TUTOR role) for a course
 * @param options.courseId Course ID (optional if groupId provided)
 * @param options.groupId Group ID (optional if courseId provided)
 * @param options.limit Optional limit (default: no limit, returns all)
 * @returns Array of teachers with profile data
 */
type TeacherProfile = {
  id: string;
  email: string | null;
  fullname: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export async function getCourseTeachers(options: {
  courseId?: string;
  groupId?: string;
  limit?: number;
}): Promise<Array<TeacherProfile>> {
  const { courseId, groupId, limit } = options;

  if (!courseId && !groupId) {
    throw new Error('Either courseId or groupId must be provided');
  }

  const profileSelect = {
    id: schema.profile.id,
    email: schema.profile.email,
    fullname: schema.profile.fullname,
    username: schema.profile.username,
    avatarUrl: schema.profile.avatarUrl
  };

  const isTeacherRole = or(eq(schema.groupmember.roleId, ROLE.ADMIN), eq(schema.groupmember.roleId, ROLE.TUTOR));

  const baseQuery = db
    .select(profileSelect)
    .from(schema.groupmember)
    .innerJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id));

  const query = courseId
    ? baseQuery
        .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
        .where(and(eq(schema.course.id, courseId), isTeacherRole))
    : baseQuery.where(and(eq(schema.groupmember.groupId, groupId!), isTeacherRole));

  const result = await (limit ? query.limit(limit) : query);

  return result;
}

/**
 * Adds a course member (person) to a course
 * @param courseId Course ID
 * @param memberData Member data (profileId, roleId, email)
 * @returns Created member
 */
export async function addCourseMember(
  courseId: string,
  memberData: { profileId?: string; roleId: number; email?: string }
): Promise<TGroupmember> {
  if (!memberData.profileId && !memberData.email) {
    throw new Error('Cannot add course member without a profileId or email');
  }

  try {
    const groupId = await getCourseGroupId(courseId);
    if (!groupId) {
      throw new Error('Course group not found');
    }

    const [newMember] = await db
      .insert(schema.groupmember)
      .values({
        groupId,
        profileId: memberData.profileId,
        roleId: memberData.roleId,
        email: memberData.email
      })
      .returning();

    if (!newMember) {
      throw new Error('Failed to create course member');
    }

    return newMember;
  } catch (error) {
    console.error('addCourseMember error:', error);
    throw new Error(`Failed to add course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @param data Partial member data to update
 * @returns Updated member
 */
export async function updateCourseMember(
  courseId: string,
  memberId: string,
  data: Partial<TGroupmember>
): Promise<TGroupmember | null> {
  try {
    // Verify member belongs to course
    const member = await getCourseMember(courseId, memberId);
    if (!member) {
      return null;
    }

    const [updated] = await db
      .update(schema.groupmember)
      .set(data)
      .where(eq(schema.groupmember.id, memberId))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateCourseMember error:', error);
    throw new Error(`Failed to update course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Deleted member or null if not found
 */
export async function deleteCourseMember(courseId: string, memberId: string): Promise<TGroupmember | null> {
  try {
    // Verify member belongs to course
    const member = await getCourseMember(courseId, memberId);
    if (!member) {
      return null;
    }

    const [deleted] = await db.delete(schema.groupmember).where(eq(schema.groupmember.id, memberId)).returning();

    return deleted || null;
  } catch (error) {
    console.error('deleteCourseMember error:', error);
    throw new Error(`Failed to delete course member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets profile data by group member ID
 * @param groupMemberId Group member ID
 * @returns Profile data or null if not found
 */
export async function getProfileByGroupMemberId(groupMemberId: string): Promise<{
  id: string;
  fullname: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
} | null> {
  try {
    const result = await db
      .select({
        id: schema.profile.id,
        fullname: schema.profile.fullname,
        username: schema.profile.username,
        avatarUrl: schema.profile.avatarUrl,
        email: schema.profile.email
      })
      .from(schema.groupmember)
      .innerJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.groupmember.id, groupMemberId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('getProfileByGroupMemberId error:', error);
    throw new Error(
      `Failed to get profile by group member ID "${groupMemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Sets when the learner first met certification threshold for this course membership.
 */
export async function setMemberCertificateEarned(memberId: string, earnedAt: string): Promise<TGroupmember | null> {
  try {
    const [updated] = await db
      .update(schema.groupmember)
      .set({ certificateEarnedAt: earnedAt })
      .where(eq(schema.groupmember.id, memberId))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('setMemberCertificateEarned error:', error);
    throw new Error(`Failed to set certificate earned: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Atomically claims the certificate for a member: only succeeds if it was not earned yet.
 * Returns true when this caller won the claim, so concurrent evaluations issue the
 * certificate (and downstream email) exactly once.
 */
export async function claimMemberCertificateEarned(memberId: string, earnedAt: string): Promise<boolean> {
  try {
    const updated = await db
      .update(schema.groupmember)
      .set({ certificateEarnedAt: earnedAt })
      .where(and(eq(schema.groupmember.id, memberId), isNull(schema.groupmember.certificateEarnedAt)))
      .returning({ id: schema.groupmember.id });
    return updated.length > 0;
  } catch (error) {
    console.error('claimMemberCertificateEarned error:', error);
    throw new Error(`Failed to claim certificate earned: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Records that the certification congratulations email was sent.
 */
export async function setMemberCertificationEmailSent(memberId: string, sentAt: string): Promise<TGroupmember | null> {
  try {
    const [updated] = await db
      .update(schema.groupmember)
      .set({ certificationEmailSentAt: sentAt })
      .where(eq(schema.groupmember.id, memberId))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('setMemberCertificationEmailSent error:', error);
    throw new Error(
      `Failed to set certification email sent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
