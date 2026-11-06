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
 * A stamp that changes whenever a course's sections, lessons or exercises change (the same rows
 * `getCourseContentStructure` reads), for use as part of a cache key so an edit invalidates the
 * cache without waiting on a TTL. Falls back to the course id for a course with no content yet.
 *
 * Hashes `(id, order, section_id, updated_at)` for every row instead of taking `MAX(updated_at)`:
 * a plain max is unchanged by deleting a row that isn't the most recently touched one, and by a
 * pure reorder or section move, since `contentWriteBumpsTimestamp` deliberately treats `order`
 * and `sectionId` as structural fields that don't bump `updated_at`. Folding those columns into
 * the hash itself, over a stable row order, makes every one of those writes change the stamp too.
 */
export async function getCourseContentVersion(courseId: string, dbClient: DbOrTxClient = db): Promise<string> {
  try {
    // Exercises still linked only through a deprecated `lesson_id` (no `course_id` of their own) are not
    // counted here; see the exercise `course_id` backfill note in content.ts.
    const [row] = await dbClient.execute<{ version: string | null }>(sql`
      SELECT md5(
        string_agg(
          id::text || ':' || "order"::text || ':' || COALESCE(section_id::text, '') || ':' || COALESCE(updated_at::text, ''),
          ',' ORDER BY id
        )
      ) AS version
      FROM (
        SELECT id, "order", NULL::uuid AS section_id, updated_at FROM course_section WHERE course_id = ${courseId}
        UNION ALL
        SELECT id, "order", section_id, updated_at FROM lesson WHERE course_id = ${courseId}
        UNION ALL
        SELECT id, "order", section_id, updated_at FROM exercise WHERE course_id = ${courseId}
      ) course_content_rows
    `);

    return row?.version ?? `empty-${courseId}`;
  } catch (error) {
    console.error('getCourseContentVersion error:', error);
    throw new Error(
      `Failed to get course content version for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
