import type { TCourseContentReorder, TCourseContentUpdate } from '@cio/utils/validation/course';
import { ContentType, ErrorCodes } from '@cio/utils/constants';

import * as schema from '@db/schema';
import { inArray, sql } from 'drizzle-orm';
import type { DbOrTxClient } from '@db/drizzle';

import { OperationalQueryError } from '../query-errors';

const { courseSection, lesson, exercise } = schema;

function buildUpdatePayload(item: TCourseContentUpdate['items'][number]) {
  const payload: Record<string, unknown> = {};

  if (item.isUnlocked !== undefined) {
    payload.isUnlocked = item.isUnlocked;
  }

  if (item.order !== undefined) {
    payload.order = item.order;
  }

  if (item.sectionId !== undefined) {
    payload.sectionId = item.sectionId;
  }

  return payload;
}

export async function applyCourseContentBulkUpdates(
  tx: DbOrTxClient,
  items: TCourseContentUpdate['items']
): Promise<{ updatedItems: number; updatedLessons: number; updatedExercises: number }> {
  const updates = items
    .map((item) => ({
      item,
      payload: buildUpdatePayload(item)
    }))
    .filter(({ payload }) => Object.keys(payload).length > 0);

  if (updates.length === 0) {
    return {
      updatedItems: 0,
      updatedLessons: 0,
      updatedExercises: 0
    };
  }

  const updatedAt = new Date().toISOString();

  const lessonUpdates = updates.filter(({ item }) => item.type === ContentType.Lesson);
  const exerciseUpdates = updates.filter(({ item }) => item.type === ContentType.Exercise);

  if (lessonUpdates.length > 0) {
    const lessonIds = lessonUpdates.map(({ item }) => item.id);
    const lessonOrderUpdates = lessonUpdates
      .filter(({ payload }) => payload.order !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.order }));
    const lessonSectionUpdates = lessonUpdates
      .filter(({ payload }) => payload.sectionId !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.sectionId }));
    const lessonUnlockUpdates = lessonUpdates
      .filter(({ payload }) => payload.isUnlocked !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.isUnlocked }));

    const lessonSet: Record<string, unknown> = {
      updatedAt
    };

    if (lessonOrderUpdates.length > 0) {
      lessonSet.order = sql`case ${lesson.id} ${sql.join(
        lessonOrderUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${lesson.order} end`;
    }

    if (lessonSectionUpdates.length > 0) {
      lessonSet.sectionId = sql`case ${lesson.id} ${sql.join(
        lessonSectionUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${lesson.sectionId} end`;
    }

    if (lessonUnlockUpdates.length > 0) {
      lessonSet.isUnlocked = sql`case ${lesson.id} ${sql.join(
        lessonUnlockUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${lesson.isUnlocked} end`;
    }

    const updatedLessons = await tx
      .update(lesson)
      .set(lessonSet)
      .where(inArray(lesson.id, lessonIds))
      .returning({ id: lesson.id });

    if (updatedLessons.length !== lessonIds.length) {
      throw new OperationalQueryError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }
  }

  if (exerciseUpdates.length > 0) {
    const exerciseIds = exerciseUpdates.map(({ item }) => item.id);
    const exerciseOrderUpdates = exerciseUpdates
      .filter(({ payload }) => payload.order !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.order }));
    const exerciseSectionUpdates = exerciseUpdates
      .filter(({ payload }) => payload.sectionId !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.sectionId }));
    const exerciseUnlockUpdates = exerciseUpdates
      .filter(({ payload }) => payload.isUnlocked !== undefined)
      .map(({ item, payload }) => ({ id: item.id, value: payload.isUnlocked }));

    const exerciseSet: Record<string, unknown> = {
      updatedAt
    };

    if (exerciseOrderUpdates.length > 0) {
      exerciseSet.order = sql`case ${exercise.id} ${sql.join(
        exerciseOrderUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${exercise.order} end`;
    }

    if (exerciseSectionUpdates.length > 0) {
      exerciseSet.sectionId = sql`case ${exercise.id} ${sql.join(
        exerciseSectionUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${exercise.sectionId} end`;
    }

    if (exerciseUnlockUpdates.length > 0) {
      exerciseSet.isUnlocked = sql`case ${exercise.id} ${sql.join(
        exerciseUnlockUpdates.map((update) => sql`when ${update.id} then ${update.value}`),
        sql` `
      )} else ${exercise.isUnlocked} end`;
    }

    const updatedExercises = await tx
      .update(exercise)
      .set(exerciseSet)
      .where(inArray(exercise.id, exerciseIds))
      .returning({ id: exercise.id });

    if (updatedExercises.length !== exerciseIds.length) {
      throw new OperationalQueryError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }
  }

  return {
    updatedItems: updates.length,
    updatedLessons: lessonUpdates.length,
    updatedExercises: exerciseUpdates.length
  };
}

export async function applyCourseSectionOrderUpdates(
  tx: DbOrTxClient,
  sections: NonNullable<TCourseContentReorder['sections']>
): Promise<number> {
  if (sections.length === 0) {
    return 0;
  }

  const sectionIds = sections.map((section) => section.id);
  const updatedAt = new Date().toISOString();
  const sectionSet: Record<string, unknown> = {
    updatedAt,
    order: sql`case ${courseSection.id} ${sql.join(
      sections.map((section) => sql`when ${section.id} then ${section.order}`),
      sql` `
    )} else ${courseSection.order} end`
  };

  const updatedSections = await tx
    .update(courseSection)
    .set(sectionSet)
    .where(inArray(courseSection.id, sectionIds))
    .returning({ id: courseSection.id });

  if (updatedSections.length !== sectionIds.length) {
    throw new OperationalQueryError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
  }

  return sections.length;
}
