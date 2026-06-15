import * as schema from '@db/schema';

import { and, eq, or } from 'drizzle-orm';

import { db } from '@db/drizzle';
import { getExerciseTitleAndMaxPoints, getStudentSubmissionsForExercise } from './certification-exercise';

export type LessonProgressionPolicy = {
  id: string;
  completionPolicy: string;
  videoWatchThreshold: number | null;
  isUnlocked: boolean | null;
};

export type ExerciseProgressionPolicy = {
  id: string;
  completionPolicy: string;
  passThreshold: number | null;
  isUnlocked: boolean | null;
};

export async function getLessonProgressionPolicies(courseId: string): Promise<LessonProgressionPolicy[]> {
  try {
    return db
      .select({
        id: schema.lesson.id,
        completionPolicy: schema.lesson.completionPolicy,
        videoWatchThreshold: schema.lesson.videoWatchThreshold,
        isUnlocked: schema.lesson.isUnlocked
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));
  } catch (error) {
    console.error('getLessonProgressionPolicies error:', error);
    throw new Error(
      `Failed to get lesson progression policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExerciseProgressionPolicies(courseId: string): Promise<ExerciseProgressionPolicy[]> {
  try {
    return db
      .select({
        id: schema.exercise.id,
        completionPolicy: schema.exercise.completionPolicy,
        passThreshold: schema.exercise.passThreshold,
        isUnlocked: schema.exercise.isUnlocked
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));
  } catch (error) {
    console.error('getExerciseProgressionPolicies error:', error);
    throw new Error(
      `Failed to get exercise progression policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function percentFromTotal(total: number, maxPoints: number): number {
  if (maxPoints <= 0) return 0;

  return Math.round((total / maxPoints) * 100);
}

export async function isExercisePassedForMember(
  exerciseId: string,
  groupMemberId: string,
  passThreshold: number
): Promise<boolean> {
  try {
    const { maxPoints } = await getExerciseTitleAndMaxPoints(exerciseId);
    if (maxPoints <= 0) return false;

    const submissions = await getStudentSubmissionsForExercise(groupMemberId, exerciseId);
    const completed = submissions.filter((submission) => submission.gradingState === 'completed');
    if (completed.length === 0) return false;

    let bestPercent = 0;
    for (const submission of completed) {
      const total = Number(submission.total ?? 0);
      const percent = percentFromTotal(total, maxPoints);
      if (percent > bestPercent) bestPercent = percent;
    }

    return bestPercent >= passThreshold;
  } catch (error) {
    console.error('isExercisePassedForMember error:', error);
    throw new Error(
      `Failed to check exercise pass status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getSubmittedExerciseIdsForMember(courseId: string, groupMemberId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ exerciseId: schema.submission.exerciseId })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.submission.submittedBy, groupMemberId),
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId))
        )
      );

    return new Set(rows.map((row) => row.exerciseId).filter((id): id is string => !!id));
  } catch (error) {
    console.error('getSubmittedExerciseIdsForMember error:', error);
    throw new Error(`Failed to get submitted exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCompletedLessonIdsForProfile(courseId: string, profileId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ lessonId: schema.lessonCompletion.lessonId })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    return new Set(rows.map((row) => row.lessonId).filter((id): id is string => !!id));
  } catch (error) {
    console.error('getCompletedLessonIdsForProfile error:', error);
    throw new Error(`Failed to get completed lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPassedExerciseIdsForMember(
  courseId: string,
  groupMemberId: string,
  policies: ExerciseProgressionPolicy[]
): Promise<Set<string>> {
  const passedIds = new Set<string>();

  await Promise.all(
    policies
      .filter((policy) => policy.completionPolicy === 'passed')
      .map(async (policy) => {
        const threshold = policy.passThreshold ?? 100;
        const passed = await isExercisePassedForMember(policy.id, groupMemberId, threshold);
        if (passed) passedIds.add(policy.id);
      })
  );

  return passedIds;
}
