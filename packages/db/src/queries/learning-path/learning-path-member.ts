import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';
import { membershipKey } from '@cio/utils';

import * as schema from '../../schema';
import type {
  TLearningPath,
  TLearningPathMember,
  TLearningPathMemberCourse,
  TNewLearningPathMember,
  TNewLearningPathMemberCourse
} from '../../types';
import { TPathMembersQuery } from '@cio/utils';

export interface TLearningPathMemberWithProfile extends TLearningPathMember {
  fullName?: string | null;
  avatarUrl?: string | null;
  profileEmail?: string | null;
  currentCourseTitle?: string | null;
  currentCourseOrder?: number | null;
}

export interface TListMembersResult {
  data: TLearningPathMemberWithProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Enrolled student members, unfiltered by table search/filters. */
  enrolledTotal: number;
}

export interface TEnrolledLearningPath {
  member: TLearningPathMember;
  learningPath: TLearningPath;
}

export interface TPathMemberCourseDetail {
  learningPathCourseId: string;
  courseId: string;
  title: string;
  order: number;
  status: TLearningPathMemberCourse['status'];
  progressPercent: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
}

export interface TPathMemberDetail {
  member: TLearningPathMemberWithProfile;
  courses: TPathMemberCourseDetail[];
}

/**
 * Enrolls a member into a learning path. Requires a profile
 * If the member was previously soft-removed, re-enrolling clears removedAt.
 */
export async function enrollMember(
  data: TNewLearningPathMember,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember> {
  if (!data.profileId) {
    throw new Error('Cannot enroll member without a profileId');
  }

  try {
    const [member] = await dbClient
      .insert(schema.learningPathMember)
      .values(data)
      .onConflictDoUpdate({
        target: [schema.learningPathMember.learningPathId, schema.learningPathMember.profileId],
        set: {
          removedAt: null,
          roleId: data.roleId ?? sql`${schema.learningPathMember.roleId}`
        }
      })
      .returning();

    if (!member) {
      throw new Error('Failed to enroll member');
    }

    return member;
  } catch (error) {
    console.error('enrollMember error:', error);
    throw new Error(
      `Failed to enroll member in learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches an active member record for a given path and profile.
 */
export async function getMemberByPathAndProfile(
  learningPathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [member] = await dbClient
      .select()
      .from(schema.learningPathMember)
      .where(
        and(
          eq(schema.learningPathMember.learningPathId, learningPathId),
          eq(schema.learningPathMember.profileId, profileId),
          isNull(schema.learningPathMember.removedAt)
        )
      )
      .limit(1);

    return member || null;
  } catch (error) {
    console.error('getMemberByPathAndProfile error:', error);
    throw new Error(
      `Failed to get member for path "${learningPathId}" and profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the set of active (pathId, profileId) memberships for the given pairs.
 * Keys use {@link membershipKey} so audience imports can skip already-enrolled profiles.
 */
export async function getExistingPathMembers(
  pairs: Array<{ learningPathId: string; profileId: string }>,
  dbClient: DbOrTxClient = db
): Promise<Set<string>> {
  if (pairs.length === 0) {
    return new Set();
  }

  try {
    const pathIds = [...new Set(pairs.map((pair) => pair.learningPathId))];
    const profileIds = [...new Set(pairs.map((pair) => pair.profileId))];

    const rows = await dbClient
      .select({
        learningPathId: schema.learningPathMember.learningPathId,
        profileId: schema.learningPathMember.profileId
      })
      .from(schema.learningPathMember)
      .where(
        and(
          inArray(schema.learningPathMember.learningPathId, pathIds),
          inArray(schema.learningPathMember.profileId, profileIds),
          isNull(schema.learningPathMember.removedAt)
        )
      );

    return new Set(
      rows
        .filter((row): row is { learningPathId: string; profileId: string } =>
          Boolean(row.learningPathId && row.profileId)
        )
        .map((row) => membershipKey(row.learningPathId, row.profileId))
    );
  } catch (error) {
    console.error('getExistingPathMembers error:', error);
    throw new Error(
      `Failed to check existing learning path members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches a learning path member by member UUID.
 */
export async function getMemberById(
  memberId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [member] = await dbClient
      .select()
      .from(schema.learningPathMember)
      .where(eq(schema.learningPathMember.id, memberId))
      .limit(1);

    return member || null;
  } catch (error) {
    console.error('getMemberById error:', error);
    throw new Error(`Failed to get member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Returns every active (non-removed) member of a path with the fields the
 * course-add backfill needs: row id for progress backfill, profileId/roleId
 * to auto-enroll student profiles into the new course group.
 * Unpaginated by design — the paginated member list would silently drop
 * members on larger paths. Order is unspecified; callers only need the set.
 */
export async function listActivePathMemberIds(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<Array<{ id: string; profileId: string | null; roleId: number }>> {
  try {
    const rows = await dbClient
      .select({
        id: schema.learningPathMember.id,
        profileId: schema.learningPathMember.profileId,
        roleId: schema.learningPathMember.roleId
      })
      .from(schema.learningPathMember)
      .where(
        and(eq(schema.learningPathMember.learningPathId, learningPathId), isNull(schema.learningPathMember.removedAt))
      );

    return rows;
  } catch (error) {
    console.error('listActivePathMemberIds error:', error);
    throw new Error(
      `Failed to list active members for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Active org-invite filter for a learning path. The app never creates
 * profile-less path-member rows (email invites enroll on acceptance), so
 * invited-but-not-joined learners live as org invites whose metadata targets
 * the path. Active = not revoked, not accepted, not expired — mirroring
 * `getActivePendingOrgInvitesForEmail`.
 */
function pendingPathInviteCondition(learningPathId: string) {
  return and(
    eq(schema.organizationInvite.type, 'EMAIL'),
    eq(schema.organizationInvite.roleId, ROLE.STUDENT),
    eq(schema.organizationInvite.isRevoked, false),
    isNull(schema.organizationInvite.acceptedAt),
    gt(schema.organizationInvite.expiresAt, sql`NOW()`),
    sql`${schema.organizationInvite.metadata} @> ${JSON.stringify({ pathIds: [learningPathId] })}::jsonb`
  );
}

/**
 * Counts learners invited to a path that have not joined yet: active org
 * invites targeting the path. Email-only member rows are never created
 * (enrollMember requires a profile), so org invites are the only source.
 */
export async function countPendingPathLearners(learningPathId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [inviteRows] = await Promise.all([
      dbClient
        .select({ count: count(schema.organizationInvite.id) })
        .from(schema.organizationInvite)
        .where(pendingPathInviteCondition(learningPathId))
    ]);

    return Number(inviteRows[0]?.count ?? 0);
  } catch (error) {
    console.error('countPendingPathLearners error:', error);
    throw new Error(
      `Failed to count pending learners for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists active members in a learning path with profile details.
 * Returns paginated result with total count.
 */
export async function listLearningPathMembers(
  learningPathId: string,
  options?: TPathMembersQuery,
  dbClient: DbOrTxClient = db
): Promise<TListMembersResult> {
  try {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const whereConditions = [
      eq(schema.learningPathMember.learningPathId, learningPathId),
      isNull(schema.learningPathMember.removedAt),
      options?.status ? eq(schema.learningPathMember.status, options.status) : undefined,
      options?.roleId !== undefined ? eq(schema.learningPathMember.roleId, options.roleId) : undefined,
      options?.search
        ? or(
            ilike(schema.profile.fullname, `%${options.search}%`),
            ilike(schema.profile.email, `%${options.search}%`),
            ilike(schema.learningPathMember.email, `%${options.search}%`)
          )
        : undefined
    ];

    // Run the filtered count (for pagination), enrolled count (for the
    // subtitle), and the paged data fetch in parallel.
    const [totalRows, enrolledRows, rows] = await Promise.all([
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .leftJoin(schema.profile, eq(schema.learningPathMember.profileId, schema.profile.id))
        .where(and(...whereConditions)),
      dbClient
        .select({ count: count(schema.learningPathMember.id) })
        .from(schema.learningPathMember)
        .where(
          and(
            eq(schema.learningPathMember.learningPathId, learningPathId),
            isNull(schema.learningPathMember.removedAt),
            eq(schema.learningPathMember.roleId, ROLE.STUDENT)
          )
        ),
      dbClient
        .select({
          member: schema.learningPathMember,
          fullName: schema.profile.fullname,
          avatarUrl: schema.profile.avatarUrl,
          profileEmail: schema.profile.email,
          currentCourseTitle: schema.course.title,
          currentCourseOrder: schema.learningPathCourse.order
        })
        .from(schema.learningPathMember)
        .leftJoin(schema.profile, eq(schema.learningPathMember.profileId, schema.profile.id))
        .leftJoin(
          schema.learningPathCourse,
          and(
            eq(schema.learningPathMember.currentCourseId, schema.learningPathCourse.courseId),
            eq(schema.learningPathCourse.learningPathId, learningPathId),
            isNull(schema.learningPathCourse.removedAt)
          )
        )
        .leftJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
        .where(and(...whereConditions))
        .orderBy(
          asc(schema.learningPathMember.roleId),
          asc(schema.learningPathMember.enrolledAt),
          asc(schema.learningPathMember.id)
        )
        .limit(limit)
        .offset((page - 1) * limit)
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);
    const enrolledTotal = Number(enrolledRows[0]?.count ?? 0);

    return {
      data: rows.map((row) => ({
        ...row.member,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
        profileEmail: row.profileEmail ?? null,
        currentCourseTitle: row.currentCourseTitle,
        currentCourseOrder: row.currentCourseOrder
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      enrolledTotal
    };
  } catch (error) {
    console.error('listLearningPathMembers error:', error);
    throw new Error(
      `Failed to list members for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns a member with profile/current-course details plus per-course progress
 * rows in path order. Powers the member detail view. Looked up by profile id,
 * matching the course person-detail convention.
 */
export async function getPathMemberDetail(
  learningPathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TPathMemberDetail | null> {
  try {
    const member = await getMemberByPathAndProfile(learningPathId, profileId, dbClient);
    if (!member) return null;

    const [memberRow] = await dbClient
      .select({
        fullName: schema.profile.fullname,
        avatarUrl: schema.profile.avatarUrl,
        profileEmail: schema.profile.email,
        currentCourseTitle: schema.course.title,
        currentCourseOrder: schema.learningPathCourse.order
      })
      .from(schema.learningPathMember)
      .leftJoin(schema.profile, eq(schema.learningPathMember.profileId, schema.profile.id))
      .leftJoin(
        schema.learningPathCourse,
        and(
          eq(schema.learningPathMember.currentCourseId, schema.learningPathCourse.courseId),
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .leftJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .where(
        and(
          eq(schema.learningPathMember.id, member.id),
          eq(schema.learningPathMember.learningPathId, learningPathId),
          isNull(schema.learningPathMember.removedAt)
        )
      )
      .limit(1);

    if (!memberRow) return null;

    const courseRows = await dbClient
      .select({
        learningPathCourseId: schema.learningPathCourse.id,
        courseId: schema.learningPathCourse.courseId,
        title: schema.course.title,
        order: schema.learningPathCourse.order,
        status: schema.learningPathMemberCourse.status,
        progressPercent: schema.learningPathMemberCourse.progressPercent,
        lessonsCompleted: schema.learningPathMemberCourse.lessonsCompleted,
        lessonsTotal: schema.learningPathMemberCourse.lessonsTotal,
        exercisesCompleted: schema.learningPathMemberCourse.exercisesCompleted,
        exercisesTotal: schema.learningPathMemberCourse.exercisesTotal,
        startedAt: schema.learningPathMemberCourse.startedAt,
        completedAt: schema.learningPathMemberCourse.completedAt,
        updatedAt: schema.learningPathMemberCourse.updatedAt
      })
      .from(schema.learningPathMemberCourse)
      .innerJoin(
        schema.learningPathCourse,
        eq(schema.learningPathMemberCourse.learningPathCourseId, schema.learningPathCourse.id)
      )
      .innerJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .where(
        and(
          eq(schema.learningPathMemberCourse.learningPathMemberId, member.id),
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .orderBy(schema.learningPathCourse.order);

    return {
      member: {
        ...member,
        fullName: memberRow.fullName,
        avatarUrl: memberRow.avatarUrl,
        profileEmail: memberRow.profileEmail ?? null,
        currentCourseTitle: memberRow.currentCourseTitle,
        currentCourseOrder: memberRow.currentCourseOrder
      },
      courses: courseRows.map((row) => ({
        ...row,
        progressPercent: Number(row.progressPercent ?? 0),
        lessonsCompleted: Number(row.lessonsCompleted ?? 0),
        lessonsTotal: Number(row.lessonsTotal ?? 0),
        exercisesCompleted: Number(row.exercisesCompleted ?? 0),
        exercisesTotal: Number(row.exercisesTotal ?? 0)
      }))
    };
  } catch (error) {
    console.error('getPathMemberDetail error:', error);
    throw new Error(
      `Failed to get member detail for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Soft-removes a member from a learning path by setting removedAt.
 * Preserves per-course cache and issued certificates.
 */
export async function removeMember(memberId: string, dbClient: DbOrTxClient = db): Promise<TLearningPathMember | null> {
  try {
    const nowIso = new Date().toISOString();
    const [removed] = await dbClient
      .update(schema.learningPathMember)
      .set({ removedAt: nowIso })
      .where(eq(schema.learningPathMember.id, memberId))
      .returning();

    return removed || null;
  } catch (error) {
    console.error('removeMember error:', error);
    throw new Error(
      `Failed to remove member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns learning paths that the given profile is actively enrolled in, optionally filtered by organization.
 */
export async function getEnrolledPaths(
  profileId: string,
  organizationId?: string,
  dbClient: DbOrTxClient = db
): Promise<TEnrolledLearningPath[]> {
  try {
    const whereConditions = [
      eq(schema.learningPathMember.profileId, profileId),
      isNull(schema.learningPathMember.removedAt)
    ];

    if (organizationId) {
      whereConditions.push(eq(schema.learningPath.organizationId, organizationId));
    }

    const rows = await dbClient
      .select({
        member: schema.learningPathMember,
        learningPath: schema.learningPath
      })
      .from(schema.learningPathMember)
      .innerJoin(schema.learningPath, eq(schema.learningPathMember.learningPathId, schema.learningPath.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.learningPathMember.enrolledAt));

    return rows;
  } catch (error) {
    console.error('getEnrolledPaths error:', error);
    throw new Error(
      `Failed to get enrolled paths for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates a member's progress cache and status.
 */
export async function updateMemberProgress(
  memberId: string,
  data: Partial<TLearningPathMember>,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [updated] = await dbClient
      .update(schema.learningPathMember)
      .set(data)
      .where(eq(schema.learningPathMember.id, memberId))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateMemberProgress error:', error);
    throw new Error(
      `Failed to update member progress for member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Initializes the member course progress cache rows on enrollment.
 * The first course is NOT_STARTED; subsequent courses are LOCKED under sequential unlock.
 */
export async function initializeMemberCourseProgress(
  memberId: string,
  pathCourseItems: { id: string; order: number }[],
  sequentialUnlock: boolean,
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (pathCourseItems.length === 0) return;

  try {
    const nowIso = new Date().toISOString();
    const sorted = [...pathCourseItems].sort((a, b) => a.order - b.order);

    const values = sorted.map((course, index) => {
      const isFirst = index === 0;
      const isUnlocked = !sequentialUnlock || isFirst;

      return {
        learningPathMemberId: memberId,
        learningPathCourseId: course.id,
        status: (isUnlocked ? 'NOT_STARTED' : 'LOCKED') as 'NOT_STARTED' | 'LOCKED',
        unlockedAt: isUnlocked ? nowIso : null,
        progressPercent: 0,
        lessonsCompleted: 0,
        exercisesCompleted: 0
      };
    });

    await dbClient.insert(schema.learningPathMemberCourse).values(values).onConflictDoNothing();
  } catch (error) {
    console.error('initializeMemberCourseProgress error:', error);
    throw new Error(
      `Failed to initialize member course progress for member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
/**
 * Backfills progress cache rows for existing members when a new course is added
 * to a learning path. Inserts NOT_STARTED rows (LOCKED when sequential unlock is
 * enabled) and leaves any existing rows untouched via onConflictDoNothing.
 */
export async function backfillMemberCourseProgressForAddedCourse(
  memberIds: string[],
  learningPathCourseId: string,
  sequentialUnlock: boolean,
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (memberIds.length === 0) return;

  try {
    const nowIso = new Date().toISOString();
    const values = memberIds.map((memberId) => ({
      learningPathMemberId: memberId,
      learningPathCourseId,
      status: (sequentialUnlock ? 'LOCKED' : 'NOT_STARTED') as 'LOCKED' | 'NOT_STARTED',
      unlockedAt: sequentialUnlock ? null : nowIso,
      progressPercent: 0,
      lessonsCompleted: 0,
      exercisesCompleted: 0
    }));

    await dbClient.insert(schema.learningPathMemberCourse).values(values).onConflictDoNothing();
  } catch (error) {
    console.error('backfillMemberCourseProgressForAddedCourse error:', error);
    throw new Error(
      `Failed to backfill member course progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns progress cache records for all courses in a learning path for a member.
 */

/**
 * Returns progress cache records for all courses in a learning path for a member.
 */
export async function getMemberCourseProgress(
  memberId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMemberCourse[]> {
  try {
    return await dbClient
      .select()
      .from(schema.learningPathMemberCourse)
      .where(eq(schema.learningPathMemberCourse.learningPathMemberId, memberId));
  } catch (error) {
    console.error('getMemberCourseProgress error:', error);
    throw new Error(
      `Failed to get member course progress for member "${memberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns progress cache record for a specific course in a learning path for a member.
 */
export async function getSingleMemberCourseProgress(
  memberId: string,
  learningPathCourseId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMemberCourse | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.learningPathMemberCourse)
      .where(
        and(
          eq(schema.learningPathMemberCourse.learningPathMemberId, memberId),
          eq(schema.learningPathMemberCourse.learningPathCourseId, learningPathCourseId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getSingleMemberCourseProgress error:', error);
    throw new Error(
      `Failed to get member course progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Upserts a member's course progress cache entry in learning_path_member_course.
 * Creates the row if it does not exist yet, or updates existing fields.
 */
export async function upsertMemberCourseProgress(
  memberId: string,
  learningPathCourseId: string,
  data: Partial<Omit<TLearningPathMemberCourse, 'id' | 'learningPathMemberId' | 'learningPathCourseId'>>,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMemberCourse> {
  try {
    const nowIso = new Date().toISOString();
    const insertPayload: TNewLearningPathMemberCourse = {
      learningPathMemberId: memberId,
      learningPathCourseId,
      status: data.status ?? 'NOT_STARTED',
      progressPercent: data.progressPercent ?? 0,
      lessonsCompleted: data.lessonsCompleted ?? 0,
      lessonsTotal: data.lessonsTotal ?? 0,
      exercisesCompleted: data.exercisesCompleted ?? 0,
      exercisesTotal: data.exercisesTotal ?? 0,
      unlockedAt: data.unlockedAt ?? (data.status === 'LOCKED' ? null : nowIso),
      startedAt: data.startedAt ?? null,
      completedAt: data.completedAt ?? null,
      updatedAt: nowIso
    };

    const [row] = await dbClient
      .insert(schema.learningPathMemberCourse)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: [
          schema.learningPathMemberCourse.learningPathMemberId,
          schema.learningPathMemberCourse.learningPathCourseId
        ],
        set: {
          ...data,
          updatedAt: nowIso
        }
      })
      .returning();

    return row;
  } catch (error) {
    console.error('upsertMemberCourseProgress error:', error);
    throw new Error(
      `Failed to upsert member course progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
