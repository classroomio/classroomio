import { AppError, ErrorCodes } from '@cio/utils/errors';
import {
  LESSON_VERSION_SESSION_IDLE_MS,
  LESSON_VERSION_SESSION_MAX_MS,
  type TLessonVersionIntent
} from '@cio/utils/constants/lesson-version';
import {
  extendLessonLanguageVersion,
  getLatestLessonLanguageVersion,
  insertLessonLanguageVersion,
  promoteLessonLanguageVersion,
  sealLatestLessonVersionsForCourse
} from '@cio/db/queries/lesson/version';

import type { DbOrTxClient } from '@cio/db/drizzle';
import type { LessonVersionSessionState } from '@cio/db/queries/lesson/version';
import type { TLessonLanguageHistory } from '@cio/db/types';

interface RecordVersionInput {
  lessonLanguageId: number;
  /** Content as it stands after the write that triggered this snapshot. */
  content: string | null;
  /** Profile that made the edit, or null for system writes (imports, agents). */
  authorId?: string | null;
  intent: TLessonVersionIntent;
  /** Author-supplied name, only meaningful for `manual` snapshots. */
  label?: string | null;
  dbClient?: DbOrTxClient;
}

interface SessionPolicyInput {
  intent: TLessonVersionIntent;
  authorId: string | null;
}

/**
 * Whether an incoming save folds into the newest snapshot instead of starting a
 * new one. This is the whole reason history stopped growing by one row per
 * keystroke pause, so the rules are spelled out rather than inlined:
 *
 * - only autosaves coalesce — an explicit save or a publish is a checkpoint the
 *   author asked for, and gets its own sealed row;
 * - a sealed session never reopens, which is how publishing resets the window;
 * - a different author gets their own entry, so history stays attributable;
 * - the session ends after `IDLE_MS` without an edit, and is capped at `MAX_MS`
 *   so continuous writing still checkpoints periodically.
 */
export function canExtendVersionSession(
  latest: Pick<
    LessonVersionSessionState,
    'kind' | 'isSealed' | 'authorId' | 'msSinceLastEdit' | 'msSinceSessionStart'
  > | null,
  { intent, authorId }: SessionPolicyInput
): boolean {
  if (!latest) return false;
  if (intent !== 'auto') return false;
  if (latest.isSealed) return false;
  if (latest.kind !== 'auto') return false;
  if ((latest.authorId ?? null) !== authorId) return false;
  if (latest.msSinceLastEdit > LESSON_VERSION_SESSION_IDLE_MS) return false;

  return latest.msSinceSessionStart <= LESSON_VERSION_SESSION_MAX_MS;
}

/**
 * Records a lesson content snapshot, coalescing consecutive autosaves into a
 * single session row.
 *
 * Call this from the same transaction as the content write so a rolled-back edit
 * cannot leave a version behind.
 *
 * @returns The snapshot the write landed in, or null when nothing was recorded.
 */
export async function recordLessonLanguageVersion({
  lessonLanguageId,
  content,
  authorId = null,
  intent,
  label = null,
  dbClient
}: RecordVersionInput): Promise<TLessonLanguageHistory | null> {
  if (intent === 'none') return null;

  try {
    const latest = await getLatestLessonLanguageVersion(lessonLanguageId, dbClient);

    // Content is unchanged since the last snapshot. An autosave has nothing to
    // record; a save or publish still needs that row marked as a milestone so
    // retention keeps it.
    if (latest && latest.newContent === content) {
      if (intent === 'auto') return latest;

      return promoteLessonLanguageVersion(latest.id, { kind: intent, label }, dbClient);
    }

    if (canExtendVersionSession(latest, { intent, authorId })) {
      return extendLessonLanguageVersion(latest!.id, { newContent: content }, dbClient);
    }

    // `sessionStartedAt` and `timestamp` are left to their `CURRENT_TIMESTAMP`
    // defaults so Postgres owns the clock; see `LessonVersionSessionState`.
    return insertLessonLanguageVersion(
      {
        lessonLanguageId,
        newContent: content,
        kind: intent,
        label,
        authorId,
        editCount: 1,
        // A checkpoint the author asked for is closed immediately; an autosave
        // session stays open so the next few edits fold into it.
        isSealed: intent !== 'auto'
      },
      dbClient
    );
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to record lesson version',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Publish boundary for a course's lesson content. Seals the newest snapshot of
 * every lesson language and marks it `publish`, so:
 *
 * - the version students were served is immutable and exempt from retention, and
 * - the next edit opens a fresh session instead of extending across the publish.
 *
 * @returns Number of snapshots sealed.
 */
export async function sealLessonVersionsOnPublish(courseId: string, dbClient?: DbOrTxClient): Promise<number> {
  try {
    return await sealLatestLessonVersionsForCourse(courseId, dbClient);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to seal lesson versions on publish',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
