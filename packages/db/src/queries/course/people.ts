import * as schema from '@db/schema';

import { TGroupmember, TNewGroupmember } from '@db/types';
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import {
  COURSE_PEOPLE_WINDOW_DAYS,
  type TCoursePeopleActivityWindow,
  type TCoursePeopleEnrolledWindow,
  type TCoursePeopleMembership,
  type TCoursePeopleProgress,
  type TCoursePeopleSortBy,
  type TCoursePeopleSortOrder
} from '@cio/utils/validation/course';
import { db } from '@db/drizzle';
import { isExerciseCompletedSql } from '@db/queries/course/progression';

export type CourseMemberWithProfile = TGroupmember & {
  profile: {
    id: string;
    fullname: string | null;
    username: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
};

export interface PaginatedCourseMembersOptions {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  certificateEarned?: boolean;
  sortBy?: TCoursePeopleSortBy;
  sortOrder?: TCoursePeopleSortOrder;
  progress?: TCoursePeopleProgress;
  membership?: TCoursePeopleMembership;
  enrolledWithin?: TCoursePeopleEnrolledWindow;
  lastLoginBefore?: TCoursePeopleActivityWindow;
}

export type PaginatedCourseMember = CourseMemberWithProfile & {
  progressPercent: number;
  progressBucket: TCoursePeopleProgress | null;
  lastLoginAt: string | null;
  enrolledAt: string | null;
};

export interface PaginatedCourseMembersResult {
  items: PaginatedCourseMember[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function mapCourseMemberRows(
  rows: Array<{
    member: TGroupmember;
    profile: CourseMemberWithProfile['profile'];
  }>
): CourseMemberWithProfile[] {
  return rows.map((row) => ({
    ...row.member,
    profile: row.profile || null
  }));
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
        }
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
 * Course work is its lessons and its exercises, matching `calcCourseProgress`.
 * An exercise belongs to the course directly or through its lesson, and an
 * exercise submission is keyed by groupmember rather than profile.
 */
function progressSummaryLateral(courseId: string): SQL {
  const totalItems = sql<number>`(
    (SELECT COUNT(*) FROM lesson l WHERE l.course_id = ${courseId}) +
    (
      SELECT COUNT(*)
      FROM exercise ex
      LEFT JOIN lesson el ON el.id = ex.lesson_id
      WHERE ex.course_id = ${courseId} OR el.course_id = ${courseId}
    )
  )::int`;

  const completedItems = sql<number>`(
    (
      SELECT COUNT(*)
      FROM lesson l
      JOIN lesson_completion lc
        ON lc.lesson_id = l.id
       AND lc.profile_id = ${schema.groupmember.profileId}
       AND lc.is_complete = true
      WHERE l.course_id = ${courseId}
    ) +
    (
      SELECT COUNT(*)
      FROM exercise ex
      LEFT JOIN lesson el ON el.id = ex.lesson_id
      WHERE (ex.course_id = ${courseId} OR el.course_id = ${courseId})
        AND ${isExerciseCompletedSql('ex', { groupMemberId: sql`${schema.groupmember.id}` })}
    )
  )::int`;

  return sql`(SELECT ${totalItems} AS total_items, ${completedItems} AS completed_items) progress`;
}

/** Only students with an account accumulate progress; everyone else is untracked. */
const isTrackableStudentSql = sql<boolean>`(${schema.groupmember.roleId} = ${ROLE.STUDENT}
  AND ${schema.groupmember.profileId} IS NOT NULL)`;

function progressExpressions(): { bucket: SQL; percent: SQL; rank: SQL } {
  const totalItems = sql<number>`COALESCE(progress.total_items, 0)`;
  const completedItems = sql<number>`COALESCE(progress.completed_items, 0)`;
  const percent = sql<number>`CASE
    WHEN (${totalItems}) = 0 THEN 0
    ELSE ROUND((${completedItems})::numeric / NULLIF(${totalItems}, 0) * 100)
  END`;

  const bucket = sql<string>`CASE
    WHEN NOT ${isTrackableStudentSql} THEN NULL
    WHEN ${schema.groupmember.certificateEarnedAt} IS NOT NULL OR (${percent}) >= 100 THEN 'completed'
    WHEN (${percent}) = 0 THEN 'not_started'
    ELSE 'in_progress'
  END`;

  return {
    bucket,
    percent,
    rank: sql<number>`CASE ${bucket}
      WHEN 'completed' THEN 2
      WHEN 'in_progress' THEN 1
      WHEN 'not_started' THEN 0
      ELSE NULL
    END`
  };
}

/** Login events only; `session.updated_at` is pruned on expiry and so cannot answer "never". */
const lastLoginAtSql = sql<string | null>`(
  SELECT MAX(le.logged_in_at)
  FROM analytics_login_events le
  WHERE le.user_id = ${schema.groupmember.profileId}
)`;

function stalenessCondition(window: TCoursePeopleActivityWindow): SQL {
  if (window === 'never') {
    return sql`${lastLoginAtSql} IS NULL`;
  }

  const cutoff = sql`now() - make_interval(days => ${COURSE_PEOPLE_WINDOW_DAYS[window]})`;

  return sql`(${lastLoginAtSql} IS NULL OR ${lastLoginAtSql} < ${cutoff})`;
}

function buildPeopleOrderBy(sortBy: TCoursePeopleSortBy, sortOrder: TCoursePeopleSortOrder): SQL[] {
  const { rank, percent } = progressExpressions();
  const ascending = sortOrder === 'asc';

  const sortColumn =
    sortBy === 'name'
      ? sql<string>`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.groupmember.email})`
      : sortBy === 'progress'
        ? percent
        : sortBy === 'lastLogin'
          ? lastLoginAtSql
          : sortBy === 'enrolledAt'
            ? sql`${schema.groupmember.createdAt}`
            : sortBy === 'certificate'
              ? sql`${schema.groupmember.certificateEarnedAt}`
              : sql`${schema.groupmember.roleId}`;

  const ordered = ascending ? asc(sortColumn) : desc(sortColumn);
  const tiebreaker = desc(schema.groupmember.id);
  const sortsOnNullable = sortBy === 'lastLogin' || sortBy === 'certificate';

  if (!sortsOnNullable) {
    return [ordered, tiebreaker];
  }

  return [desc(sql`${sortColumn} IS NOT NULL`), ordered, tiebreaker];
}

/**
 * Gets one filtered, sorted page of course members with profile data.
 */
export async function getPaginatedCourseMembers(
  courseId: string,
  options: PaginatedCourseMembersOptions
): Promise<PaginatedCourseMembersResult> {
  const { page, limit, search, roleId, certificateEarned, sortBy, sortOrder } = options;
  const progress = sortBy ?? 'role';
  const { bucket, percent } = progressExpressions();

  try {
    const conditions: SQL[] = [eq(schema.course.id, courseId)];

    if (roleId) {
      conditions.push(eq(schema.groupmember.roleId, roleId));
    }

    if (certificateEarned !== undefined) {
      conditions.push(
        certificateEarned
          ? isNotNull(schema.groupmember.certificateEarnedAt)
          : isNull(schema.groupmember.certificateEarnedAt)
      );
    }

    if (options.membership === 'invited') {
      conditions.push(isNull(schema.groupmember.profileId));
    }

    if (options.membership === 'joined') {
      conditions.push(isNotNull(schema.groupmember.profileId));
    }

    if (options.progress) {
      conditions.push(sql`${bucket} = ${options.progress}`);
    }

    if (options.enrolledWithin) {
      const cutoff = sql`now() - make_interval(days => ${COURSE_PEOPLE_WINDOW_DAYS[options.enrolledWithin]})`;
      conditions.push(sql`${schema.groupmember.createdAt} >= ${cutoff}`);
    }

    if (options.lastLoginBefore) {
      conditions.push(stalenessCondition(options.lastLoginBefore));
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

    const whereClause = and(...conditions)!;
    const lateral = progressSummaryLateral(courseId);
    const countNeedsProgress = Boolean(options.progress) || progress === 'progress';

    const countQuery = db
      .select({ count: count(schema.groupmember.id) })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .$dynamic();

    if (countNeedsProgress) {
      countQuery.leftJoinLateral(lateral, sql`true`);
    }

    const [countRow] = await countQuery.where(whereClause);
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
        progressPercent: percent,
        progressBucket: bucket,
        lastLoginAt: lastLoginAtSql,
        enrolledAt: schema.groupmember.createdAt
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .leftJoinLateral(lateral, sql`true`)
      .where(whereClause)
      .orderBy(...buildPeopleOrderBy(progress, sortOrder ?? 'asc'))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      items: rows.map((row) => ({
        ...row.member,
        profile: row.profile || null,
        progressPercent: Number(row.progressPercent ?? 0),
        progressBucket: (row.progressBucket as TCoursePeopleProgress | null) ?? null,
        lastLoginAt: row.lastLoginAt ?? null,
        enrolledAt: row.enrolledAt ?? null
      })),
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
export async function getCourseMember(
  courseId: string,
  memberId: string
): Promise<
  | (TGroupmember & {
      profile: {
        id: string;
        fullname: string | null;
        username: string | null;
        avatarUrl: string | null;
        email: string | null;
      } | null;
    })
  | null
> {
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
        }
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
      profile: result[0].profile || null
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
    const message = `Failed to add course member: ${error instanceof Error ? error.message : 'Unknown error'}`;
    throw Object.assign(new Error(message), { cause: error });
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
      .where(and(eq(schema.groupmember.id, memberId), eq(schema.groupmember.groupId, member.groupId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateCourseMember error:', error);
    const message = `Failed to update course member: ${error instanceof Error ? error.message : 'Unknown error'}`;
    throw Object.assign(new Error(message), { cause: error });
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

    const [deleted] = await db
      .delete(schema.groupmember)
      .where(and(eq(schema.groupmember.id, memberId), eq(schema.groupmember.groupId, member.groupId)))
      .returning();

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
