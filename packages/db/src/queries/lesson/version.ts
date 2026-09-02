import * as schema from '@db/schema';

import type { TLessonLanguageHistory, TLessonVersion, TNewLessonLanguageHistory } from '@db/types';
import type { TLessonVersionKind } from '@cio/utils/constants/lesson-version';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Newest snapshot plus how long ago it happened, used to decide whether an
 * autosave folds into an open editing session.
 *
 * The elapsed times are computed by Postgres rather than in JS. `timestamp` and
 * `session_started_at` are `timestamp without time zone` written by
 * `CURRENT_TIMESTAMP`, so they hold *local* wall time. Parsing those strings in
 * JS and diffing against `Date.now()` silently skews by the server's UTC offset,
 * which made every save look older than the session window and defeated
 * coalescing entirely. `localtimestamp` keeps both sides of the subtraction in
 * the same frame.
 */
export interface LessonVersionSessionState extends TLessonLanguageHistory {
  msSinceLastEdit: number;
  msSinceSessionStart: number;
}

export async function getLatestLessonLanguageVersion(
  lessonLanguageId: number,
  dbClient?: DbOrTxClient
): Promise<LessonVersionSessionState | null> {
  const client = dbClient ?? db;

  try {
    const [latest] = await client
      .select({
        ...getTableColumns(schema.lessonLanguageHistory),
        msSinceLastEdit: sql<number>`(extract(epoch from (localtimestamp - ${schema.lessonLanguageHistory.timestamp})) * 1000)::double precision`,
        msSinceSessionStart: sql<number>`(extract(epoch from (localtimestamp - ${schema.lessonLanguageHistory.sessionStartedAt})) * 1000)::double precision`
      })
      .from(schema.lessonLanguageHistory)
      .where(eq(schema.lessonLanguageHistory.lessonLanguageId, lessonLanguageId))
      .orderBy(desc(schema.lessonLanguageHistory.timestamp), desc(schema.lessonLanguageHistory.id))
      .limit(1);

    return latest ?? null;
  } catch (error) {
    console.error('getLatestLessonLanguageVersion error:', error);
    throw new Error(
      `Failed to get latest lesson language version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Starts a new version session. */
export async function insertLessonLanguageVersion(
  data: TNewLessonLanguageHistory,
  dbClient?: DbOrTxClient
): Promise<TLessonLanguageHistory> {
  const client = dbClient ?? db;

  try {
    const [version] = await client.insert(schema.lessonLanguageHistory).values(data).returning();
    if (!version) {
      throw new Error('Insert returned no row');
    }

    return version;
  } catch (error) {
    console.error('insertLessonLanguageVersion error:', error);
    throw new Error(
      `Failed to insert lesson language version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Folds another save into an existing session: the row keeps its
 * `sessionStartedAt` (so the diff still spans the whole session) while its
 * content, end time, and edit count move forward.
 */
export async function extendLessonLanguageVersion(
  versionId: number,
  values: { newContent: string | null },
  dbClient?: DbOrTxClient
): Promise<TLessonLanguageHistory> {
  const client = dbClient ?? db;

  try {
    const [version] = await client
      .update(schema.lessonLanguageHistory)
      .set({
        newContent: values.newContent,
        // Stamped by Postgres so it matches the frame of the column default.
        timestamp: sql`localtimestamp`,
        editCount: sql`${schema.lessonLanguageHistory.editCount} + 1`
      })
      .where(eq(schema.lessonLanguageHistory.id, versionId))
      .returning();

    if (!version) {
      throw new Error('Version not found');
    }

    return version;
  } catch (error) {
    console.error('extendLessonLanguageVersion error:', error);
    throw new Error(
      `Failed to extend lesson language version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Upgrades an existing snapshot to a milestone and seals it. Used when the
 * author saves or publishes without having changed anything since the last
 * autosave — the row already holds the right content, it just needs the stronger
 * kind so retention keeps it.
 */
export async function promoteLessonLanguageVersion(
  versionId: number,
  values: { kind: TLessonVersionKind; label?: string | null },
  dbClient?: DbOrTxClient
): Promise<TLessonLanguageHistory> {
  const client = dbClient ?? db;

  try {
    const [version] = await client
      .update(schema.lessonLanguageHistory)
      .set({
        kind: values.kind,
        label: values.label ?? null,
        isSealed: true
      })
      .where(eq(schema.lessonLanguageHistory.id, versionId))
      .returning();

    if (!version) {
      throw new Error('Version not found');
    }

    return version;
  } catch (error) {
    console.error('promoteLessonLanguageVersion error:', error);
    throw new Error(
      `Failed to promote lesson language version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Publish boundary. Marks the newest snapshot of every lesson language in a
 * course as the published one and seals it, so the next autosave opens a fresh
 * session instead of rewriting the content students were served.
 *
 * @returns Number of snapshots sealed.
 */
export async function sealLatestLessonVersionsForCourse(courseId: string, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    const rows = await client.execute(sql`
      WITH latest AS (
        SELECT DISTINCT ON (llh.lesson_language_id) llh.id
        FROM lesson_language_history llh
        JOIN lesson_language ll ON ll.id = llh.lesson_language_id
        JOIN lesson l ON l.id = ll.lesson_id
        WHERE l.course_id = ${courseId}
        ORDER BY llh.lesson_language_id, llh."timestamp" DESC, llh.id DESC
      )
      UPDATE lesson_language_history h
      SET kind = 'publish', is_sealed = true
      FROM latest
      WHERE h.id = latest.id
      RETURNING h.id
    `);

    return rows.length;
  } catch (error) {
    console.error('sealLatestLessonVersionsForCourse error:', error);
    throw new Error(
      `Failed to seal lesson versions for course: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets lesson version history for a lesson and locale, newest first.
 *
 * `oldContent` is derived by the `lesson_versions` view from the preceding
 * snapshot, so a thinned history still diffs correctly — the jump is just wider.
 *
 * @param lessonId Lesson ID
 * @param locale Locale
 * @param endRange End range for pagination (0-indexed, inclusive)
 */
export async function getLessonVersionHistory(
  lessonId: string,
  locale: string,
  endRange: number
): Promise<TLessonVersion[]> {
  try {
    const result = await db
      .select()
      .from(schema.lessonVersions)
      .where(and(eq(schema.lessonVersions.lessonId, lessonId), eq(schema.lessonVersions.locale, locale as any)))
      .orderBy(desc(schema.lessonVersions.timestamp), desc(schema.lessonVersions.id))
      .limit(endRange + 1);

    if (result.length > 0) {
      return result;
    }

    // Older lessons may not have a history row yet. Expose their current content
    // so the version viewer is useful before the next edit creates a snapshot.
    const [currentLanguage] = await db
      .select()
      .from(schema.lessonLanguage)
      .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale as any)))
      .limit(1);

    if (!currentLanguage) {
      return [];
    }

    const now = new Date().toISOString();
    const currentVersion: TLessonVersion = {
      id: 0,
      oldContent: null,
      newContent: currentLanguage.content,
      kind: 'auto',
      label: null,
      sessionStartedAt: now,
      timestamp: now,
      editCount: 1,
      isSealed: false,
      authorId: null,
      authorName: null,
      authorAvatarUrl: null,
      locale: currentLanguage.locale,
      lessonId: currentLanguage.lessonId
    };

    return [currentVersion];
  } catch (error) {
    console.error('getLessonVersionHistory error:', error);
    throw new Error(
      `Failed to get lesson version history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Tiered thinning of autosave snapshots. Milestones (`manual`, `publish`) and the
 * newest snapshot of each lesson language are never touched; everything else is
 * kept at decreasing resolution as it ages:
 *
 * - within `keepAllHours` — every snapshot
 * - within `hourlyDays`   — the last snapshot of each hour
 * - within `dailyDays`    — the last snapshot of each day
 * - older                 — deleted
 *
 * @returns Number of snapshots deleted.
 */
export async function pruneAutoLessonVersions(
  options: { keepAllHours: number; hourlyDays: number; dailyDays: number },
  dbClient?: DbOrTxClient
) {
  const client = dbClient ?? db;

  try {
    const rows = await client.execute(sql`
      WITH newest AS (
        SELECT DISTINCT ON (lesson_language_id) id
        FROM lesson_language_history
        ORDER BY lesson_language_id, "timestamp" DESC, id DESC
      ),
      prunable AS (
        SELECT h.id,
               h."timestamp",
               row_number() OVER (
                 PARTITION BY h.lesson_language_id, date_trunc('hour', h."timestamp")
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS hour_rank,
               row_number() OVER (
                 PARTITION BY h.lesson_language_id, date_trunc('day', h."timestamp")
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS day_rank
        FROM lesson_language_history h
        WHERE h.kind = 'auto'
          AND h.id NOT IN (SELECT id FROM newest)
          AND h."timestamp" < now() - make_interval(hours => ${options.keepAllHours})
      )
      DELETE FROM lesson_language_history h
      USING prunable p
      WHERE h.id = p.id
        AND CASE
              WHEN p."timestamp" >= now() - make_interval(days => ${options.hourlyDays}) THEN p.hour_rank > 1
              WHEN p."timestamp" >= now() - make_interval(days => ${options.dailyDays}) THEN p.day_rank > 1
              ELSE true
            END
      RETURNING h.id
    `);

    return rows.length;
  } catch (error) {
    console.error('pruneAutoLessonVersions error:', error);
    throw new Error(`Failed to prune lesson versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hard cap on autosave snapshots per lesson language, independent of age. Catches
 * pathological writers that would otherwise pile up thousands of rows before the
 * age-based tiers get a chance to thin them.
 *
 * @returns Number of snapshots deleted.
 */
export async function capAutoLessonVersionsPerLanguage(maxPerLanguage: number, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    const rows = await client.execute(sql`
      WITH ranked AS (
        SELECT h.id,
               row_number() OVER (
                 PARTITION BY h.lesson_language_id
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS recency_rank
        FROM lesson_language_history h
        WHERE h.kind = 'auto'
      )
      DELETE FROM lesson_language_history h
      USING ranked r
      WHERE h.id = r.id
        AND r.recency_rank > ${maxPerLanguage}
      RETURNING h.id
    `);

    return rows.length;
  } catch (error) {
    console.error('capAutoLessonVersionsPerLanguage error:', error);
    throw new Error(`Failed to cap lesson versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
