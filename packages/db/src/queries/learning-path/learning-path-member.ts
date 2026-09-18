import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

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
}

export interface TEnrolledLearningPath {
  member: TLearningPathMember;
  learningPath: TLearningPath;
}

/**
 * Enrolls a member into a learning path.
 * If the member was previously soft-removed, re-enrolling clears removedAt.
 */
export async function enrollMember(
  data: TNewLearningPathMember,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember> {
  if (!data.profileId && !data.email) {
    throw new Error('Cannot enroll member without a profileId or email');
  }

  try {
    if (data.profileId) {
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
    }

    const [member] = await dbClient
      .insert(schema.learningPathMember)
      .values(data)
      .onConflictDoUpdate({
        target: [schema.learningPathMember.learningPathId, schema.learningPathMember.email],
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
 * Lists active members in a learning path with profile details.
 */
export async function listLearningPathMembers(
  learningPathId: string,
  options?: TPathMembersQuery,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMemberWithProfile[]> {
  try {
    let query = dbClient
      .select({
        member: schema.learningPathMember,
        fullName: schema.profile.fullname,
        avatarUrl: schema.profile.avatarUrl
      })
      .from(schema.learningPathMember)
      .leftJoin(schema.profile, eq(schema.learningPathMember.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.learningPathMember.learningPathId, learningPathId),
          isNull(schema.learningPathMember.removedAt),
          options?.status ? eq(schema.learningPathMember.status, options.status) : undefined
        )
      )
      .orderBy(desc(schema.learningPathMember.enrolledAt));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    if (options?.page) {
      query = query.offset((options.page - 1) * options.limit) as typeof query;
    }

    const rows = await query;

    return rows.map((row) => ({
      ...row.member,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl
    }));
  } catch (error) {
    console.error('listLearningPathMembers error:', error);
    throw new Error(
      `Failed to list members for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
