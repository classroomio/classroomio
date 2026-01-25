import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

async function backfillExerciseCourse() {
  try {
    const result = await db.execute(sql`
      UPDATE exercise AS e
      SET course_id = l.course_id,
          section_id = l.section_id
      FROM lesson AS l
      WHERE e.lesson_id = l.id
        AND (e.course_id IS NULL OR e.section_id IS NULL)
    `);

    const lessonOrderResult = await db.execute(sql`
      WITH ordered_lessons AS (
        SELECT
          id,
          course_id,
          section_id,
          ROW_NUMBER() OVER (
            PARTITION BY course_id, section_id
            ORDER BY created_at
          ) AS content_order
        FROM lesson
      )
      UPDATE lesson
      SET "order" = ordered_lessons.content_order
      FROM ordered_lessons
      WHERE lesson.id = ordered_lessons.id
        AND lesson."order" IS NULL
    `);

    const exerciseOrderResult = await db.execute(sql`
      WITH lesson_data AS (
        SELECT id, course_id, section_id, created_at AS lesson_created_at
        FROM lesson
      ),
      content_order AS (
        SELECT
          lesson_data.id AS lesson_id,
          NULL::uuid AS exercise_id,
          lesson_data.course_id,
          lesson_data.section_id,
          lesson_data.lesson_created_at AS lesson_created_at,
          lesson_data.lesson_created_at AS item_created_at,
          0 AS type_rank
        FROM lesson_data
        UNION ALL
        SELECT
          exercise.lesson_id AS lesson_id,
          exercise.id AS exercise_id,
          lesson_data.course_id,
          COALESCE(exercise.section_id, lesson_data.section_id) AS section_id,
          lesson_data.lesson_created_at AS lesson_created_at,
          exercise.created_at AS item_created_at,
          1 AS type_rank
        FROM exercise
        JOIN lesson_data ON lesson_data.id = exercise.lesson_id
      ),
      ordered_content AS (
        SELECT
          lesson_id,
          exercise_id,
          course_id,
          section_id,
          ROW_NUMBER() OVER (
            PARTITION BY course_id, section_id
            ORDER BY lesson_created_at, type_rank, item_created_at
          ) AS content_order
        FROM content_order
      )
      UPDATE exercise
      SET "order" = ordered_content.content_order
      FROM ordered_content
      WHERE exercise.id = ordered_content.exercise_id
        AND exercise."order" IS NULL
    `);

    console.log('Exercise backfill completed', result);
    console.log('Lesson order backfill completed', lessonOrderResult);
    console.log('Exercise order backfill completed', exerciseOrderResult);

    process.exit(0);
  } catch (error) {
    console.error('Failed to backfill exercise course data', error);
    process.exit(1);
  }
}

backfillExerciseCourse();
