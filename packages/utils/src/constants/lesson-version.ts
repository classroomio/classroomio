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

/**
 * Who made a block change, stored on history rows and lesson revisions:
 * - `editor`    — a person in the lesson editor or another dashboard surface.
 * - `assistant` — the AI assistant, on behalf of the teacher who ran it.
 * - `restore`   — a version history restore or undo.
 * - `mcp`       — an AI client connected through MCP; the client's name is stored beside it.
 * - `api`       — an integration using the public API; its key's label is stored beside it.
 */
export const BLOCK_CHANGE_SOURCE_VALUES = ['editor', 'assistant', 'restore', 'mcp', 'api'] as const;

export type TBlockChangeSource = (typeof BLOCK_CHANGE_SOURCE_VALUES)[number];

/** Who a write is attributed to; spread into the options of block, translation and lesson writes. */
export interface TBlockChangeAttribution {
  source?: TBlockChangeSource;
  clientName?: string | null;
}

/** Longest client name stored on a history row; longer names are cut. */
export const BLOCK_CHANGE_CLIENT_NAME_MAX_LENGTH = 80;

/** Days a block removed from every lesson stays restorable before the maintenance job purges it. */
export const DELETED_BLOCK_RETENTION_DAYS = 30;
