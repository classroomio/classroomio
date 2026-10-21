/**
 * Postgres `LESSON_VERSION_KIND` enum values — shared by Drizzle schema and Zod validation.
 *
 * How a lesson version snapshot came to exist:
 * - `auto`    — produced by autosave; prunable by the retention job.
 * - `manual`  — the author explicitly saved a checkpoint; kept forever.
 * - `publish` — the content students were served at publish time; kept forever.
 */
export const LESSON_VERSION_KIND_VALUES = ['auto', 'manual', 'publish'] as const;

export type TLessonVersionKind = (typeof LESSON_VERSION_KIND_VALUES)[number];

/**
 * What a caller intends a write to do to version history. Adds `none` on top of
 * the stored kinds, for bulk writes (imports, migrations) that should not appear
 * in a tutor's history at all.
 */
export const LESSON_VERSION_INTENT_VALUES = [...LESSON_VERSION_KIND_VALUES, 'none'] as const;

export type TLessonVersionIntent = (typeof LESSON_VERSION_INTENT_VALUES)[number];

/**
 * Coalescing window. Consecutive autosaves by the same author fold into the
 * newest unsealed snapshot while both hold:
 * - less than `IDLE_MS` since the last edit (a pause longer than this ends the session), and
 * - less than `MAX_MS` since the session began (so continuous writing still checkpoints).
 */
export const LESSON_VERSION_SESSION_IDLE_MS = 10 * 60 * 1_000;
export const LESSON_VERSION_SESSION_MAX_MS = 60 * 60 * 1_000;
