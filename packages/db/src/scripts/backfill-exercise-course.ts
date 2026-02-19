import { eq, isNotNull } from 'drizzle-orm';
import { exercise, lesson } from '../schema';

import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

async function backfillExerciseCourse() {
  try {
    const result = await setExerciseCourseAndSectionId();

    // TypeScript implementation of exercise ordering logic
    // Algorithm:
    // 1. Fetch each lesson (grouped by course_id, section_id, ordered by lesson order or created_at)
    // 2. For each lesson, fetch its related exercises (ordered by createdAt)
    // 3. Create a linear sequence: lesson, then its exercises, then next lesson, etc.
    // 4. Assign sequential order numbers
    // 5. Update exercises with their new order values

    // Step 1: Fetch all lessons with their order (or calculate it from created_at)
    const allLessons = await db
      .select({
        id: lesson.id,
        courseId: lesson.courseId,
        sectionId: lesson.sectionId,
        order: lesson.order,
        createdAt: lesson.createdAt
      })
      .from(lesson);

    // Group lessons by course_id and section_id
    type LessonWithOrder = (typeof allLessons)[0] & { calculatedOrder: number };
    const lessonsByGroup = new Map<string, LessonWithOrder[]>();

    for (const lessonItem of allLessons) {
      const groupKey = `${lessonItem.courseId || 'null'}-${lessonItem.sectionId || 'null'}`;

      if (!lessonsByGroup.has(groupKey)) {
        lessonsByGroup.set(groupKey, []);
      }
      // Add calculatedOrder property when pushing
      lessonsByGroup.get(groupKey)!.push({
        ...lessonItem,
        calculatedOrder: lessonItem.order ?? 0 // Temporary, will be recalculated
      });
    }

    // Calculate order for lessons that don't have one, within each group
    for (const [groupKey, groupLessons] of lessonsByGroup.entries()) {
      // Sort by existing order (nulls last), then by created_at
      groupLessons.sort((a, b) => {
        if (a.order !== null && b.order !== null) {
          return a.order - b.order;
        }
        if (a.order !== null) return -1;
        if (b.order !== null) return 1;
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      });

      // Assign calculated order
      groupLessons.forEach((lessonItem, index) => {
        lessonItem.calculatedOrder = lessonItem.order ?? index + 1;
      });
    }

    // Step 2: Fetch all exercises that have a lesson_id
    const allExercises = await db
      .select({
        id: exercise.id,
        lessonId: exercise.lessonId,
        courseId: exercise.courseId,
        sectionId: exercise.sectionId,
        createdAt: exercise.createdAt
      })
      .from(exercise)
      .where(isNotNull(exercise.lessonId));

    // Group exercises by lesson_id
    const exercisesByLesson = new Map<string, typeof allExercises>();
    for (const exerciseItem of allExercises) {
      if (!exerciseItem.lessonId) continue;

      if (!exercisesByLesson.has(exerciseItem.lessonId)) {
        exercisesByLesson.set(exerciseItem.lessonId, []);
      }
      exercisesByLesson.get(exerciseItem.lessonId)!.push(exerciseItem);
    }

    // Sort exercises within each lesson by createdAt
    for (const exercises of exercisesByLesson.values()) {
      exercises.sort((a, b) => {
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      });
    }

    // Step 3: Create linear sequence - lesson, then its exercises, then next lesson, etc.
    interface ContentItem {
      type: 'lesson' | 'exercise';
      lessonId: string | null;
      exerciseId: string | null;
      courseId: string;
      sectionId: string | null;
      lessonOrder: number;
      sortOffset: number;
    }

    const allItems: ContentItem[] = [];

    // Process each group (course_id + section_id combination)
    for (const [groupKey, groupLessons] of lessonsByGroup.entries()) {
      // Sort lessons by their calculated order
      const sortedLessons = [...groupLessons].sort((a, b) => a.calculatedOrder - b.calculatedOrder);

      for (const lessonItem of sortedLessons) {
        // Add the lesson itself
        allItems.push({
          type: 'lesson',
          lessonId: lessonItem.id,
          exerciseId: null,
          courseId: lessonItem.courseId,
          sectionId: lessonItem.sectionId,
          lessonOrder: lessonItem.calculatedOrder,
          sortOffset: 0 // Lessons always have offset 0
        });

        // Add exercises for this lesson (sorted by createdAt)
        const lessonExercises = exercisesByLesson.get(lessonItem.id) || [];
        for (let i = 0; i < lessonExercises.length; i++) {
          const exerciseItem = lessonExercises[i];
          allItems.push({
            type: 'exercise',
            lessonId: exerciseItem.lessonId,
            exerciseId: exerciseItem.id,
            courseId: exerciseItem.courseId || lessonItem.courseId,
            sectionId: exerciseItem.sectionId || lessonItem.sectionId,
            lessonOrder: lessonItem.calculatedOrder,
            sortOffset: i + 1 // Exercises have offset 1, 2, 3, etc.
          });
        }
      }
    }

    // Step 4: Sort all items by lesson_order, then sort_offset (within each course_id + section_id group)
    allItems.sort((a, b) => {
      const groupKeyA = `${a.courseId}-${a.sectionId || 'null'}`;
      const groupKeyB = `${b.courseId}-${b.sectionId || 'null'}`;

      if (groupKeyA !== groupKeyB) {
        return groupKeyA.localeCompare(groupKeyB);
      }

      if (a.lessonOrder !== b.lessonOrder) {
        return a.lessonOrder - b.lessonOrder;
      }

      return a.sortOffset - b.sortOffset;
    });

    // Step 5: Assign sequential order numbers within each group and update exercises
    const orderUpdates: Array<{ exerciseId: string; order: number }> = [];
    let currentOrder = 1;
    let lastGroupKey = '';

    for (const item of allItems) {
      const groupKey = `${item.courseId}-${item.sectionId || 'null'}`;

      // Reset order counter when we move to a new group
      if (groupKey !== lastGroupKey) {
        currentOrder = 1;
        lastGroupKey = groupKey;
      }

      // Only update exercises (not lessons)
      if (item.type === 'exercise' && item.exerciseId) {
        orderUpdates.push({
          exerciseId: item.exerciseId,
          order: currentOrder
        });
      }

      currentOrder++;
    }

    // Batch update exercises
    let exerciseOrderResult;
    if (orderUpdates.length > 0) {
      // Use a transaction to update all exercises
      exerciseOrderResult = await db.transaction(async (tx) => {
        const updatePromises = orderUpdates.map((update) =>
          tx.update(exercise).set({ order: update.order }).where(eq(exercise.id, update.exerciseId))
        );
        await Promise.all(updatePromises);
        return { rowCount: orderUpdates.length };
      });
    } else {
      exerciseOrderResult = { rowCount: 0 };
    }

    console.log('Exercise backfill completed', result);
    console.log('Exercise order backfill completed', exerciseOrderResult);

    process.exit(0);
  } catch (error) {
    console.error('Failed to backfill exercise course data', error);
    process.exit(1);
  }
}

async function setExerciseCourseAndSectionId() {
  return db.execute(sql`
    UPDATE exercise AS e
    SET course_id = l.course_id,
        section_id = l.section_id
    FROM lesson AS l
    WHERE e.lesson_id = l.id
      AND (e.course_id IS NULL OR e.section_id IS NULL)
  `);
}

backfillExerciseCourse();
