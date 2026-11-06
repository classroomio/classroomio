import { db, type DbOrTxClient } from '@db/drizzle';
import { sql } from 'drizzle-orm';

const STRUCTURAL_FIELDS = new Set(['order', 'sectionId']);

export function contentWriteBumpsTimestamp(fields: readonly string[]) {
  return fields.some((field) => !STRUCTURAL_FIELDS.has(field));
}

export function stampContentUpdatedAt<T extends object>(data: T, updatedAt = new Date().toISOString()) {
  return { ...data, updatedAt };
}

/**
 * A stamp that changes whenever a course's sections, lessons, exercises, or lesson block content
 * changes (the same rows `getCourseContentStructure` reads), for use as part of a cache key so an
 * edit invalidates the cache without waiting on a TTL. Falls back to the course id for a course
 * with no content yet.
 *
 * Hashes `(id, order, section_id, updated_at)` for every section/lesson/exercise row instead of
 * taking `MAX(updated_at)`: a plain max is unchanged by deleting a row that isn't the most
 * recently touched one, and by a pure reorder or section move, since `contentWriteBumpsTimestamp`
 * deliberately treats `order` and `sectionId` as structural fields that don't bump `updated_at`.
 * Folding those columns into the hash itself, over a stable row order, makes every one of those
 * writes change the stamp too.
 *
 * The exercise rows mirror both legs of `getCourseContentStructure`'s exercise union, including
 * the legacy leg for exercises still linked only through the deprecated `lesson_id` column (no
 * `course_id` of their own): that row class is still returned by the structure query, so leaving
 * it out of the hash would mean an edit to one of those exercises never invalidates the cache.
 *
 * Also hashes every lesson's block placements (adding, removing or reordering a block), per
 * placement the owning block's `updated_at` (covers a slide/video/document block's own data), and
 * every locale of that block by the content itself rather than `block_locale.updated_at` (covers
 * note text): not every write path that changes `content` is guaranteed to also bump its
 * `updated_at`, so hashing the text directly is the only way that's reliably correct.
 */
export async function getCourseContentVersion(courseId: string, dbClient: DbOrTxClient = db): Promise<string> {
  try {
    const [row] = await dbClient.execute<{ version: string | null }>(sql`
      SELECT md5(
        COALESCE((
          SELECT string_agg(
            id::text || ':' || "order"::text || ':' || COALESCE(section_id::text, '') || ':' || COALESCE(updated_at::text, ''),
            ',' ORDER BY id
          )
          FROM (
            SELECT id, "order", NULL::uuid AS section_id, updated_at FROM course_section WHERE course_id = ${courseId}
            UNION ALL
            SELECT id, "order", section_id, updated_at FROM lesson WHERE course_id = ${courseId}
            UNION ALL
            SELECT id, "order", section_id, updated_at FROM exercise WHERE course_id = ${courseId}
            UNION ALL
            SELECT exercise.id, exercise."order", exercise.section_id, exercise.updated_at
            FROM exercise
            JOIN lesson ON lesson.id = exercise.lesson_id
            WHERE (exercise.course_id IS NULL OR exercise.course_id <> ${courseId})
              AND lesson.course_id = ${courseId}
          ) course_content_rows
        ), '')
        || '|' ||
        COALESCE((
          SELECT string_agg(
            bp.id::text || ':' || b.type || ':' || COALESCE(b.updated_at::text, ''),
            ',' ORDER BY bp.id
          )
          FROM block_placement bp
          JOIN lesson l ON l.id = bp.lesson_id
          JOIN block b ON b.id = bp.block_id
          WHERE l.course_id = ${courseId}
        ), '')
        || '|' ||
        COALESCE((
          SELECT string_agg(
            bl.block_id::text || ':' || bl.locale || ':' || md5(COALESCE(bl.content, '')),
            ',' ORDER BY bl.block_id, bl.locale
          )
          FROM block_locale bl
          JOIN block_placement bp ON bp.block_id = bl.block_id
          JOIN lesson l ON l.id = bp.lesson_id
          WHERE l.course_id = ${courseId}
        ), '')
      ) AS version
    `);

    return row?.version ?? `empty-${courseId}`;
  } catch (error) {
    console.error('getCourseContentVersion error:', error);
    throw new Error(
      `Failed to get course content version for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
