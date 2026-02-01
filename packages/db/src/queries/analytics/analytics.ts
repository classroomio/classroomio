import * as schema from '@db/schema';

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Gets the last login time for a user
 * @param userId User ID
 * @returns Last login timestamp or undefined
 */
export async function getLastLogin(userId: string): Promise<string | null> {
  try {
    const [loginEvent] = await db
      .select({
        loggedInAt: schema.analyticsLoginEvents.loggedInAt
      })
      .from(schema.analyticsLoginEvents)
      .where(eq(schema.analyticsLoginEvents.userId, userId))
      .orderBy(desc(schema.analyticsLoginEvents.loggedInAt))
      .limit(1);

    return loginEvent?.loggedInAt;
  } catch (error) {
    console.error('Error fetching last login:', error);
    return null;
  }
}

/**
 * Gets user exercise statistics for a course
 * @param courseId Course ID
 * @param userId User ID (profile ID)
 * @returns Array of exercise stats with scores and completion status
 */
export async function getUserExercisesStats(courseId: string, userId: string) {
  try {
    const exercises = await db
      .select({
        id: schema.exercise.id,
        title: schema.exercise.title,
        lessonId: schema.exercise.lessonId,
        lessonTitle: schema.lesson.title
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

    // Get submissions for these exercises by this user
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
      );

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
        status: userSubmission?.statusId,
        score: userSubmission?.total || 0,
        totalPoints,
        isCompleted: !!userSubmission
      };
    });

    return exerciseStats;
  } catch (error) {
    console.error('Error fetching user exercises stats:', error);
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
    console.error('Error fetching lessons with completion:', error);
    return [];
  }
}

/**
 * Gets profile course progress (lessons and exercises completed)
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Course progress data
 */
export async function getProfileCourseProgress(courseId: string, profileId: string) {
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
      .where(eq(schema.lesson.courseId, courseId));

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
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));

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
    console.error('Error fetching profile course progress:', error);
    return {
      lessons_count: 0,
      lessons_completed: 0,
      exercises_count: 0,
      exercises_completed: 0
    };
  }
}
