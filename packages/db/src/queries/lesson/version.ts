import * as schema from '@db/schema';

import type { TLessonLanguageHistory, TLessonVersion, TNewLessonLanguageHistory } from '@db/types';
import type { TLessonVersionKind } from '@cio/utils/constants/lesson-version';
import { and, desc, eq, getTableColumns, lt, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/** Keyset cursor: the (timestamp, id) of the last row already returned. */
export type TLessonVersionCursor = {
  timestamp: string;
  id: number;
};

export type TLessonVersionPage = {
  items: TLessonVersion[];
  /** Null when the last page has been reached. */
  nextCursor: TLessonVersionCursor | null;
};

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

/**
 * Transaction-scoped lock serializing version bookkeeping for one lesson
 * language. Without it, two overlapping autosaves both read "no open session"
 * (or the same open session) and each insert or extend independently, producing
 * duplicate sessions or letting the later-committing statement win with stale
 * content. Released automatically when the transaction ends.
 */
export async function lockLessonLanguageVersionSession(lessonLanguageId: number, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    await client.execute(sql`select pg_advisory_xact_lock(hashtext(${`lesson_version:${lessonLanguageId}`}))`);
  } catch (error) {
    console.error('lockLessonLanguageVersionSession error:', error);
    throw new Error(
      `Failed to lock lesson language version session: ${error instanceof Error ? error.message : 'Unknown error'}`
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
 *
 * The session must still be an open autosave at update time. A publish or an
 * explicit save running in another transaction can seal it after the caller
 * read it, and rewriting a sealed snapshot would mutate the version students
 * were served. Returns null in that case so the caller opens a new session
 * instead.
 */
export async function extendLessonLanguageVersion(
  versionId: number,
  values: { newContent: string | null },
  dbClient?: DbOrTxClient
): Promise<TLessonLanguageHistory | null> {
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
      .where(
        and(
          eq(schema.lessonLanguageHistory.id, versionId),
          eq(schema.lessonLanguageHistory.kind, 'auto'),
          eq(schema.lessonLanguageHistory.isSealed, false)
        )
      )
      .returning();

    return version ?? null;
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
    const sealed = await client.execute(sql`
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

    // A lesson language can reach publication with no history at all: it
    // predates versioning, or it was written by an importer that opted out.
    // Snapshot its current content so every published lesson has an immutable
    // record of what students received.
    const created = await client.execute(sql`
      INSERT INTO lesson_language_history (lesson_language_id, new_content, kind, is_sealed)
      SELECT ll.id, ll.content, 'publish', true
      FROM lesson_language ll
      JOIN lesson l ON l.id = ll.lesson_id
      WHERE l.course_id = ${courseId}
        AND NOT EXISTS (
          SELECT 1 FROM lesson_language_history h WHERE h.lesson_language_id = ll.id
        )
      RETURNING id
    `);

    return sealed.length + created.length;
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
  limit: number,
  cursor?: TLessonVersionCursor
): Promise<TLessonVersionPage> {
  try {
    // Keyset, not offset: the list is ordered by (timestamp, id) and rows are only ever
    // appended at the newest end, so seeking past the last row read is stable under
    // concurrent edits and costs the same at page 1 and page 50.
    const olderThanCursor = cursor
      ? or(
          lt(schema.lessonVersions.timestamp, cursor.timestamp),
          and(eq(schema.lessonVersions.timestamp, cursor.timestamp), lt(schema.lessonVersions.id, cursor.id))
        )
      : undefined;

    const rows = await db
      .select()
      .from(schema.lessonVersions)
      .where(
        and(
          eq(schema.lessonVersions.lessonId, lessonId),
          eq(schema.lessonVersions.locale, locale as any),
          olderThanCursor
        )
      )
      .orderBy(desc(schema.lessonVersions.timestamp), desc(schema.lessonVersions.id))
      // One extra row is the has-more probe; it is trimmed before returning.
      .limit(limit + 1);

    if (rows.length > 0) {
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const last = items[items.length - 1];
      // `lessonVersions` is a view, so its columns type as nullable. Without both keys
      // there is no stable seek point, so stop rather than hand back a broken cursor.
      const canSeekPastLast = hasMore && last?.timestamp != null && last?.id != null;

      return {
        items,
        nextCursor: canSeekPastLast ? { timestamp: last.timestamp!, id: last.id! } : null
      };
    }

    // A cursor that ran past the end has no fallback to offer — the synthesized
    // current-content row below belongs to the first page only.
    if (cursor) {
      return { items: [], nextCursor: null };
    }

    // Older lessons may not have a history row yet. Expose their current content
    // so the version viewer is useful before the next edit creates a snapshot.
    const [currentLanguage] = await db
      .select()
      .from(schema.lessonLanguage)
      .where(and(eq(schema.lessonLanguage.lessonId, lessonId), eq(schema.lessonLanguage.locale, locale as any)))
      .limit(1);

    if (!currentLanguage) {
      return { items: [], nextCursor: null };
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

    return { items: [currentVersion], nextCursor: null };
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
