import * as schema from '@db/schema';

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

function toIsoTimestamp(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function pickLatestTimestamp(...values: Array<string | Date | null | undefined>): string | null {
  let latest: string | null = null;
  let latestTime = -Infinity;

  for (const value of values) {
    const iso = toIsoTimestamp(value);
    if (!iso) {
      continue;
    }

    const time = new Date(iso).getTime();
    if (time > latestTime) {
      latestTime = time;
      latest = iso;
    }
  }

  return latest;
}

/**
 * Gets the last seen time for a user from login events and active sessions.
 * @param userId User ID
 * @returns Last seen timestamp or null
 */
export async function getLastLogin(userId: string): Promise<string | null> {
  try {
    const [[loginEvent], [sessionEvent]] = await Promise.all([
      db
        .select({
          loggedInAt: schema.analyticsLoginEvents.loggedInAt
        })
        .from(schema.analyticsLoginEvents)
        .where(eq(schema.analyticsLoginEvents.userId, userId))
        .orderBy(desc(schema.analyticsLoginEvents.loggedInAt))
        .limit(1),
      db
        .select({
          updatedAt: schema.session.updatedAt
        })
        .from(schema.session)
        .where(eq(schema.session.userId, userId))
        .orderBy(desc(schema.session.updatedAt))
        .limit(1)
    ]);

    return pickLatestTimestamp(loginEvent?.loggedInAt, sessionEvent?.updatedAt);
  } catch (error) {
    console.error('getLastLogin error:', error);
    return null;
  }
}

/**
 * Batch lookup of last seen timestamps for multiple users.
 * @param userIds User IDs
 * @returns Map of user ID to last seen ISO timestamp
 */
export async function getLastSeenForUserIds(userIds: string[]): Promise<Map<string, string | null>> {
  const uniqueUserIds = [...new Set(userIds)];
  const lastSeenByUserId = new Map<string, string | null>(uniqueUserIds.map((userId) => [userId, null]));

  if (uniqueUserIds.length === 0) {
    return lastSeenByUserId;
  }

  try {
    const [loginRows, sessionRows] = await Promise.all([
      db
        .select({
          userId: schema.analyticsLoginEvents.userId,
          lastSeen: sql<string>`MAX(${schema.analyticsLoginEvents.loggedInAt})`.as('last_seen')
        })
        .from(schema.analyticsLoginEvents)
        .where(inArray(schema.analyticsLoginEvents.userId, uniqueUserIds))
        .groupBy(schema.analyticsLoginEvents.userId),
      db
        .select({
          userId: schema.session.userId,
          lastSeen: sql<string>`MAX(${schema.session.updatedAt})`.as('last_seen')
        })
        .from(schema.session)
        .where(inArray(schema.session.userId, uniqueUserIds))
        .groupBy(schema.session.userId)
    ]);

    for (const row of loginRows) {
      const current = lastSeenByUserId.get(row.userId) ?? null;
      lastSeenByUserId.set(row.userId, pickLatestTimestamp(current, row.lastSeen));
    }

    for (const row of sessionRows) {
      const current = lastSeenByUserId.get(row.userId) ?? null;
      lastSeenByUserId.set(row.userId, pickLatestTimestamp(current, row.lastSeen));
    }

    return lastSeenByUserId;
  } catch (error) {
    console.error('getLastSeenForUserIds error:', error);
    return lastSeenByUserId;
  }
}

/**
 * Gets user exercise statistics for a course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns Array of exercise stats with scores and completion status
 */
export async function getUserExercisesStats(courseId: string, userId: string, options: { failOnError?: boolean } = {}) {
  try {
    const exercises = await db
      .select({
        id: schema.exercise.id,
        title: schema.exercise.title,
        lessonId: schema.exercise.lessonId,
        lessonTitle: schema.lesson.title,
        completionPolicy: schema.exercise.completionPolicy
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));

    if (exercises.length === 0) {
      return [];
    }

    const exerciseIds = exercises.map((e) => e.id);

    // Get questions for these exercises with points
    const questions = await db
      .select({
        exerciseId: schema.question.exerciseId,
        points: schema.question.points
      })
      .from(schema.question)
      .where(inArray(schema.question.exerciseId, exerciseIds));

    // Get groupmember for the user in this course's group
    const course = await db
      .select({
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course[0] || !course[0].groupId) {
      return [];
    }

    const groupMember = await db
      .select({
        id: schema.groupmember.id
      })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, course[0].groupId), eq(schema.groupmember.profileId, userId)))
      .limit(1);

    if (!groupMember[0]) {
      return [];
    }

    // Get submissions for these exercises by this user. Most recent wins—order
    // by created_at, tie-broken by id, so submissions.find(...) below returns a
    // deterministic row for a student with multiple submissions per exercise.
    const submissions = await db
      .select({
        id: schema.submission.id,
        exerciseId: schema.submission.exerciseId,
        total: schema.submission.total,
        statusId: schema.submission.statusId
      })
      .from(schema.submission)
      .where(
        and(inArray(schema.submission.exerciseId, exerciseIds), eq(schema.submission.submittedBy, groupMember[0].id))
      )
      .orderBy(desc(schema.submission.createdAt), desc(schema.submission.id));

    // Build exercise stats
    const exerciseStats = exercises.map((exercise) => {
      const exerciseQuestions = questions.filter((q) => q.exerciseId === exercise.id);
      const totalPoints = exerciseQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

      const userSubmission = submissions.find((s) => s.exerciseId === exercise.id);
      return {
        id: exercise.id,
        lessonId: exercise.lessonId,
        lessonTitle: exercise.lessonTitle || '',
        title: exercise.title,
        completionPolicy: exercise.completionPolicy,
        status: userSubmission?.statusId,
        score: userSubmission?.total || 0,
        totalPoints,
        isCompleted: !!userSubmission
      };
    });

    return exerciseStats;
  } catch (error) {
    console.error('getUserExerciseStats error:', error);
    if (options.failOnError) {
      throw new Error('Failed to fetch user exercise stats');
    }
    return [];
  }
}

/**
 * Gets lessons with completion status for a user in a course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns Array of lessons with completion status
 */
export async function getLessonsWithCompletion(courseId: string, userId: string) {
  try {
    const lessons = await db
      .select({
        id: schema.lesson.id,
        title: schema.lesson.title,
        createdAt: schema.lesson.createdAt
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const lessonIds = lessons.map((l) => l.id);

    if (lessonIds.length === 0) {
      return lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        created_at: lesson.createdAt,
        completed: false,
        exerciseNo: 0
      }));
    }

    // Get lesson completions
    const completions = await db
      .select({
        lessonId: schema.lessonCompletion.lessonId
      })
      .from(schema.lessonCompletion)
      .where(
        and(
          inArray(schema.lessonCompletion.lessonId, lessonIds),
          eq(schema.lessonCompletion.profileId, userId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    // Get exercise counts per lesson
    const exercises = await db
      .select({
        lessonId: schema.exercise.lessonId
      })
      .from(schema.exercise)
      .where(inArray(schema.exercise.lessonId, lessonIds));

    const completionSet = new Set(completions.map((c) => c.lessonId).filter((id): id is string => id !== null));
    const exerciseCounts = new Map<string, number>();
    exercises.forEach((e) => {
      if (e.lessonId) {
        exerciseCounts.set(e.lessonId, (exerciseCounts.get(e.lessonId) || 0) + 1);
      }
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      created_at: lesson.createdAt,
      completed: completionSet.has(lesson.id),
      exerciseNo: exerciseCounts.get(lesson.id) || 0
    }));
  } catch (error) {
    console.error('getLessonsWithCompletion error:', error);
    return [];
  }
}

/**
 * Gets profile course progress (lessons and exercises completed)
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Course progress data
 */
export async function getProfileCourseProgress(
  courseId: string,
  profileId: string,
  options: { failOnError?: boolean } = {}
) {
  try {
    // Get course group
    const course = await db
      .select({
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course[0]) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    // Get groupmember for this user
    if (!course[0].groupId) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    const groupMember = await db
      .select({
        id: schema.groupmember.id
      })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, course[0].groupId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    if (!groupMember[0]) {
      return {
        lessons_count: 0,
        lessons_completed: 0,
        exercises_count: 0,
        exercises_completed: 0
      };
    }

    // Get lessons count
    const lessonsResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(schema.lesson)
      .where(and(eq(schema.lesson.courseId, courseId), sql`${schema.lesson.completionPolicy} != 'none'`));

    const lessonsCount = Number(lessonsResult[0]?.count || 0);

    // Get lessons completed count
    const lessonsCompletedResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.lessonCompletion.lessonId})`.as('count')
      })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          sql`${schema.lesson.completionPolicy} != 'none'`,
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    const lessonsCompleted = Number(lessonsCompletedResult[0]?.count || 0);

    // Get exercises count
    const exercisesResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
          sql`${schema.exercise.completionPolicy} != 'none'`
        )
      );

    const exercisesCount = Number(exercisesResult[0]?.count || 0);

    // Get exercises completed count
    const exercisesCompletedResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.submission.exerciseId})`.as('count')
      })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
          sql`${schema.exercise.completionPolicy} != 'none'`,
          eq(schema.submission.submittedBy, groupMember[0].id)
        )
      );

    const exercisesCompleted = Number(exercisesCompletedResult[0]?.count || 0);

    return {
      lessons_count: lessonsCount,
      lessons_completed: lessonsCompleted,
      exercises_count: exercisesCount,
      exercises_completed: exercisesCompleted
    };
  } catch (error) {
    console.error('getProfileCourseProgress error:', error);
    if (options.failOnError) {
      throw new Error('Failed to fetch profile course progress');
    }
    return {
      lessons_count: 0,
      lessons_completed: 0,
      exercises_count: 0,
      exercises_completed: 0
    };
  }
}
