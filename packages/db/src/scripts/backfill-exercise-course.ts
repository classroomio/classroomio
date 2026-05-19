import { and, eq, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { exercise, lesson } from '../schema';

import { db } from '../drizzle';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(scriptDir, '../../backups');

const orderBatchSize = Number.parseInt(process.env.EXERCISE_BACKFILL_BATCH_SIZE ?? '200', 10) || 200;

/** Optional course scope: `pnpm db:exercise-backfill [courseId]` */
const scopedCourseId = process.argv[2]?.trim() || null;

type LessonRow = {
  id: string;
  courseId: string;
  sectionId: string | null;
  order: number | null;
  createdAt: string | null;
};

type ExerciseRow = {
  id: string;
  lessonId: string | null;
  courseId: string | null;
  sectionId: string | null;
  order: number | null;
  createdAt: string | null;
};

type OrderUpdate = { id: string; order: number };

type FailedOrderBatch = {
  table: 'lesson' | 'exercise';
  batchIndex: number;
  rowCount: number;
  ids: string[];
  error: string;
};

type OrderBackfillReport = {
  startedAt: string;
  completedAt: string;
  courseId: string | null;
  batchSize: number;
  summary: {
    lessonsAttempted: number;
    lessonsUpdated: number;
    lessonsFailed: number;
    exercisesAttempted: number;
    exercisesUpdated: number;
    exercisesFailed: number;
  };
  failures: FailedOrderBatch[];
  reportPath: string;
};

/**
 * Migrates lesson-attached exercises from the V1 model to the V2 linear content model.
 *
 * **V1:** exercises nested under a lesson (`exercise.lesson_id`); lesson `order` was the
 * only sequence that mattered for navigation.
 *
 * **V2:** lessons and exercises share one `order` column per course (and per section when
 * `section_id` is set). The UI sorts both tables by that single sequence.
 *
 * Runs two phases in order:
 * 1. {@link setExerciseCourseAndSectionId} — copy `course_id` / `section_id` from the parent lesson.
 * 2. {@link assignLinearContentOrder} — renumber `lesson.order` and `exercise.order` in one shared sequence.
 *
 * @example
 * // Single course (dry-run scope while validating):
 * pnpm --filter @cio/db db:exercise-backfill 73432009-4c40-457d-9e90-6b48b18b0e23
 *
 * @example
 * // All courses:
 * pnpm --filter @cio/db db:exercise-backfill
 */
async function backfillExerciseCourse() {
  try {
    const courseSectionResult = await setExerciseCourseAndSectionId(scopedCourseId);
    const orderResult = await assignLinearContentOrder(scopedCourseId);

    console.log('Exercise course/section backfill completed', courseSectionResult);
    console.log('Linear content order backfill completed', orderResult.summary);
    console.log('Report written to', orderResult.reportPath);

    if (orderResult.failures.length > 0) {
      console.error(`${orderResult.failures.length} batch(es) failed — see report for ids and errors.`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to backfill exercise course data', error);
    process.exit(1);
  }
}

/**
 * Assigns a single 1-based `order` sequence to lessons and their child exercises.
 *
 * **Grouping** — Items are processed independently per `(course_id, section_id)` bucket.
 * Unsectioned content uses `section_id = null`. Section order is not changed here.
 *
 * **Lesson ordering** — Within each bucket, lessons are sorted by existing `order`
 * (ascending), with `null` orders last; ties break on `created_at`.
 *
 * **Exercise ordering** — Exercises with a `lesson_id` are grouped under that lesson.
 * Within a lesson, exercises sort by `order` then `created_at` (same comparator as lessons).
 *
 * **Linear sequence** — For each lesson in sorted order, emit one slot for the lesson,
 * then one slot per child exercise (in exercise sort order). Assign `order = 1..n` across
 * that combined list and persist both tables in batched `CASE` updates
 * (`EXERCISE_BACKFILL_BATCH_SIZE`, default 200). Failed batches are logged and skipped;
 * the run continues until all batches are attempted. See `packages/db/backups/exercise-backfill-report-*.json`.
 *
 * Example (one section bucket):
 *
 * ```
 * Before (lesson order only):     After (shared order):
 * L1 order=1                      L1 order=1
 *   └ Ea (nested)                   Ea order=2
 *   └ Eb                            Eb order=3
 * L2 order=2                      L2 order=4
 *   └ Ec                            Ec order=5
 * ```
 *
 * Only exercises that still have `lesson_id` are included. Course-level exercises
 * (`lesson_id IS NULL`) are left unchanged.
 *
 * @param courseId — When set, only lessons/exercises for this course are loaded and updated.
 */
async function assignLinearContentOrder(courseId: string | null) {
  const lessonWhere = courseId ? eq(lesson.courseId, courseId) : undefined;

  const allLessons = await db
    .select({
      id: lesson.id,
      courseId: lesson.courseId,
      sectionId: lesson.sectionId,
      order: lesson.order,
      createdAt: lesson.createdAt
    })
    .from(lesson)
    .where(lessonWhere);

  const allExercises = await db
    .select({
      id: exercise.id,
      lessonId: exercise.lessonId,
      courseId: exercise.courseId,
      sectionId: exercise.sectionId,
      order: exercise.order,
      createdAt: exercise.createdAt
    })
    .from(exercise)
    .leftJoin(lesson, eq(exercise.lessonId, lesson.id))
    .where(
      courseId
        ? and(or(eq(exercise.courseId, courseId), eq(lesson.courseId, courseId)), isNotNull(exercise.lessonId))
        : isNotNull(exercise.lessonId)
    );

  const lessonsByGroup = new Map<string, LessonRow[]>();
  for (const lessonRow of allLessons) {
    const key = groupKey(lessonRow.courseId, lessonRow.sectionId);
    const group = lessonsByGroup.get(key) ?? [];
    group.push(lessonRow);
    lessonsByGroup.set(key, group);
  }

  const exercisesByLesson = new Map<string, ExerciseRow[]>();
  for (const exerciseRow of allExercises) {
    if (!exerciseRow.lessonId) {
      continue;
    }

    const lessonExercises = exercisesByLesson.get(exerciseRow.lessonId) ?? [];
    lessonExercises.push(exerciseRow);
    exercisesByLesson.set(exerciseRow.lessonId, lessonExercises);
  }

  for (const lessonExercises of exercisesByLesson.values()) {
    sortExercises(lessonExercises);
  }

  const lessonOrderUpdates: Array<{ id: string; order: number }> = [];
  const exerciseOrderUpdates: Array<{ id: string; order: number }> = [];

  for (const [, groupLessons] of lessonsByGroup) {
    const sortedLessons = sortLessons(groupLessons);
    let nextOrder = 1;

    for (const lessonRow of sortedLessons) {
      lessonOrderUpdates.push({ id: lessonRow.id, order: nextOrder });
      nextOrder += 1;

      const lessonExercises = exercisesByLesson.get(lessonRow.id) ?? [];
      for (const exerciseRow of lessonExercises) {
        exerciseOrderUpdates.push({ id: exerciseRow.id, order: nextOrder });
        nextOrder += 1;
      }
    }
  }

  const startedAt = new Date().toISOString();
  const failures: FailedOrderBatch[] = [];

  const lessonsUpdated = await applyBatchedOrderUpdates('lesson', lessonOrderUpdates, failures);
  const exercisesUpdated = await applyBatchedOrderUpdates('exercise', exerciseOrderUpdates, failures);

  const report = buildOrderBackfillReport({
    startedAt,
    courseId,
    lessonOrderUpdates,
    exerciseOrderUpdates,
    lessonsUpdated,
    exercisesUpdated,
    failures
  });

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(report.reportPath, JSON.stringify(report, null, 2));

  return report;
}

/**
 * Denormalizes `course_id` and `section_id` onto exercises from their parent lesson.
 *
 * Updates rows where `lesson_id` is set and either `course_id` or `section_id` is still null,
 * so later queries can filter exercises by course without joining `lesson`.
 */
async function setExerciseCourseAndSectionId(courseId: string | null) {
  if (courseId) {
    return db.execute(sql`
      UPDATE exercise AS e
      SET course_id = l.course_id,
          section_id = l.section_id
      FROM lesson AS l
      WHERE e.lesson_id = l.id
        AND l.course_id = ${courseId}
        AND (e.course_id IS NULL OR e.section_id IS NULL)
    `);
  }

  return db.execute(sql`
    UPDATE exercise AS e
    SET course_id = l.course_id,
        section_id = l.section_id
    FROM lesson AS l
    WHERE e.lesson_id = l.id
      AND (e.course_id IS NULL OR e.section_id IS NULL)
  `);
}

async function applyBatchedOrderUpdates(
  table: 'lesson' | 'exercise',
  updates: OrderUpdate[],
  failures: FailedOrderBatch[]
) {
  if (updates.length === 0) {
    return 0;
  }

  let updatedCount = 0;
  const totalBatches = Math.ceil(updates.length / orderBatchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const batchStart = batchIndex * orderBatchSize;
    const batch = updates.slice(batchStart, batchStart + orderBatchSize);
    const batchIds = batch.map((update) => update.id);

    try {
      if (table === 'lesson') {
        await db
          .update(lesson)
          .set({
            order: sql`case ${lesson.id} ${sql.join(
              batch.map((update) => sql`when ${update.id} then ${update.order}`),
              sql` `
            )} else ${lesson.order} end`
          })
          .where(inArray(lesson.id, batchIds));
      } else {
        await db
          .update(exercise)
          .set({
            order: sql`case ${exercise.id} ${sql.join(
              batch.map((update) => sql`when ${update.id} then ${update.order}`),
              sql` `
            )} else ${exercise.order} end`
          })
          .where(inArray(exercise.id, batchIds));
      }

      updatedCount += batch.length;
      console.log(`Updated ${table} batch ${batchIndex + 1}/${totalBatches} (${batch.length} rows)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      failures.push({
        table,
        batchIndex,
        rowCount: batch.length,
        ids: batchIds,
        error: message
      });

      console.error(`Failed ${table} batch ${batchIndex + 1}/${totalBatches} (${batch.length} rows):`, message);
    }
  }

  return updatedCount;
}

function buildOrderBackfillReport(input: {
  startedAt: string;
  courseId: string | null;
  lessonOrderUpdates: OrderUpdate[];
  exerciseOrderUpdates: OrderUpdate[];
  lessonsUpdated: number;
  exercisesUpdated: number;
  failures: FailedOrderBatch[];
}): OrderBackfillReport {
  const stamp = input.startedAt.replace(/[:.]/g, '-');
  const reportPath = path.join(backupDir, `exercise-backfill-report-${stamp}.json`);

  const lessonsAttempted = input.lessonOrderUpdates.length;
  const exercisesAttempted = input.exerciseOrderUpdates.length;
  const lessonsFailed = input.failures
    .filter((failure) => failure.table === 'lesson')
    .reduce((count, failure) => count + failure.rowCount, 0);
  const exercisesFailed = input.failures
    .filter((failure) => failure.table === 'exercise')
    .reduce((count, failure) => count + failure.rowCount, 0);

  return {
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    courseId: input.courseId,
    batchSize: orderBatchSize,
    summary: {
      lessonsAttempted,
      lessonsUpdated: input.lessonsUpdated,
      lessonsFailed,
      exercisesAttempted,
      exercisesUpdated: input.exercisesUpdated,
      exercisesFailed
    },
    failures: input.failures,
    reportPath
  };
}

function groupKey(courseId: string, sectionId: string | null) {
  return `${courseId}-${sectionId ?? 'null'}`;
}

function compareByOrderThenCreatedAt<T extends { order: number | null; createdAt: string | null }>(left: T, right: T) {
  if (left.order !== null && right.order !== null) {
    return left.order - right.order;
  }

  if (left.order !== null) {
    return -1;
  }

  if (right.order !== null) {
    return 1;
  }

  return new Date(left.createdAt || '').getTime() - new Date(right.createdAt || '').getTime();
}

function sortLessons(lessons: LessonRow[]) {
  return [...lessons].sort(compareByOrderThenCreatedAt);
}

function sortExercises(exercises: ExerciseRow[]) {
  return [...exercises].sort(compareByOrderThenCreatedAt);
}

backfillExerciseCourse();
