import * as schema from '@db/schema';
import type { TNotification } from '@db/types';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type NotificationSubject = {
  courseTitle: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  subjectTitle: string | null;
  subjectSlug: string | null;
  dueAt: string | null;
  startsAt: string | null;
  completedCount: number | null;
  requiredCount: number | null;
};

type SubjectRef = Pick<TNotification, 'id' | 'entityType' | 'entityId' | 'courseId' | 'actorProfileId'>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idsOf(refs: SubjectRef[], entityType: SubjectRef['entityType']) {
  return [...new Set(refs.filter((ref) => ref.entityType === entityType).map((ref) => ref.entityId))];
}

function uuidsOnly(ids: Array<string | null>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id && UUID_PATTERN.test(id))))];
}

/**
 * Loads the live display data each notification refers to (course and actor names, entity titles, due and start
 * times) in one query per entity type, keyed by notification id. Missing rows (deleted since) resolve to nulls.
 */
export async function loadNotificationSubjects(refs: SubjectRef[]): Promise<Map<string, NotificationSubject>> {
  if (refs.length === 0) return new Map();

  try {
    const courseIds = uuidsOnly(refs.map((ref) => ref.courseId));
    const actorIds = uuidsOnly(refs.map((ref) => ref.actorProfileId));
    const lessonIds = uuidsOnly(idsOf(refs, 'lesson'));
    const exerciseIds = uuidsOnly(idsOf(refs, 'exercise'));
    const recordIds = uuidsOnly(idsOf(refs, 'compliance_record'));
    const assignmentIds = uuidsOnly(idsOf(refs, 'cohort_goal_assignment'));
    const questionIds = idsOf(refs, 'community_question')
      .map(Number)
      .filter((id) => Number.isSafeInteger(id));

    const [courses, actors, lessons, exercises, records, assignments, questions] = await Promise.all([
      courseIds.length
        ? db
            .select({ id: schema.course.id, title: schema.course.title })
            .from(schema.course)
            .where(inArray(schema.course.id, courseIds))
        : [],
      actorIds.length
        ? db
            .select({ id: schema.profile.id, fullname: schema.profile.fullname, avatarUrl: schema.profile.avatarUrl })
            .from(schema.profile)
            .where(inArray(schema.profile.id, actorIds))
        : [],
      lessonIds.length
        ? db
            .select({ id: schema.lesson.id, title: schema.lesson.title, lessonAt: schema.lesson.lessonAt })
            .from(schema.lesson)
            .where(inArray(schema.lesson.id, lessonIds))
        : [],
      exerciseIds.length
        ? db
            .select({ id: schema.exercise.id, title: schema.exercise.title })
            .from(schema.exercise)
            .where(inArray(schema.exercise.id, exerciseIds))
        : [],
      recordIds.length
        ? db
            .select({ id: schema.courseCompletionRecord.id, dueDate: schema.courseCompletionRecord.dueDate })
            .from(schema.courseCompletionRecord)
            .where(inArray(schema.courseCompletionRecord.id, recordIds))
        : [],
      assignmentIds.length
        ? db
            .select({
              id: schema.cohortGoalAssignment.id,
              title: schema.cohortGoal.title,
              dueDate: schema.cohortGoalAssignment.dueDate,
              completedCount: schema.cohortGoalAssignment.completedCount,
              requiredCount: schema.cohortGoalAssignment.requiredCount
            })
            .from(schema.cohortGoalAssignment)
            .innerJoin(schema.cohortGoal, eq(schema.cohortGoal.id, schema.cohortGoalAssignment.goalId))
            .where(inArray(schema.cohortGoalAssignment.id, assignmentIds))
        : [],
      questionIds.length
        ? db
            .select({
              id: schema.communityQuestion.id,
              title: schema.communityQuestion.title,
              slug: schema.communityQuestion.slug
            })
            .from(schema.communityQuestion)
            .where(inArray(schema.communityQuestion.id, questionIds))
        : []
    ]);

    const courseById = new Map(courses.map((row) => [row.id, row]));
    const actorById = new Map(actors.map((row) => [row.id, row]));
    const lessonById = new Map(lessons.map((row) => [row.id, row]));
    const exerciseById = new Map(exercises.map((row) => [row.id, row]));
    const recordById = new Map(records.map((row) => [row.id, row]));
    const assignmentById = new Map(assignments.map((row) => [row.id, row]));
    const questionById = new Map(questions.map((row) => [String(row.id), row]));

    return new Map(
      refs.map((ref) => {
        const course = ref.courseId ? courseById.get(ref.courseId) : undefined;
        const actor = ref.actorProfileId ? actorById.get(ref.actorProfileId) : undefined;
        const lesson = ref.entityType === 'lesson' ? lessonById.get(ref.entityId) : undefined;
        const exercise = ref.entityType === 'exercise' ? exerciseById.get(ref.entityId) : undefined;
        const record = ref.entityType === 'compliance_record' ? recordById.get(ref.entityId) : undefined;
        const assignment = ref.entityType === 'cohort_goal_assignment' ? assignmentById.get(ref.entityId) : undefined;
        const question = ref.entityType === 'community_question' ? questionById.get(ref.entityId) : undefined;

        const subject: NotificationSubject = {
          courseTitle: course?.title ?? null,
          actorName: actor?.fullname || null,
          actorAvatarUrl: actor?.avatarUrl ?? null,
          subjectTitle: lesson?.title ?? exercise?.title ?? question?.title ?? assignment?.title ?? null,
          subjectSlug: question?.slug ?? null,
          dueAt: record?.dueDate ?? assignment?.dueDate ?? null,
          startsAt: lesson?.lessonAt ?? null,
          completedCount: assignment?.completedCount ?? null,
          requiredCount: assignment?.requiredCount ?? null
        };

        return [ref.id, subject];
      })
    );
  } catch (error) {
    console.error('loadNotificationSubjects error:', error);
    throw new Error('Failed to load notification subjects');
  }
}
