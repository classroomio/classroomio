export const LIVE_SESSION_REMINDER_DEFAULT_OFFSETS_MINUTES = [1440, 60] as const;

export const LIVE_SESSION_REMINDER_MIN_OFFSET_MINUTES = 15;

export const LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES = 7 * 24 * 60;

export const LIVE_SESSION_REMINDER_MAX_COUNT = 5;

/** Postgres `LIVE_SESSION_REMINDER_STATUS` enum values — shared by Drizzle schema and Zod validation. */
export const LIVE_SESSION_REMINDER_STATUS_VALUES = ['pending', 'queued', 'sent', 'failed', 'skipped'] as const;

export type TLiveSessionReminderStatus = (typeof LIVE_SESSION_REMINDER_STATUS_VALUES)[number];

export const LIVE_SESSION_REMINDER_SKIP_REASONS = [
  'preferences',
  'no_email',
  'lesson_past',
  'offset_removed',
  'lesson_rescheduled',
  'window_passed',
  'unenrolled'
] as const;

export type TLiveSessionReminderSkipReason = (typeof LIVE_SESSION_REMINDER_SKIP_REASONS)[number];

/**
 * Reminder offsets for a course, falling back to the platform default when the course never configured any.
 */
export function resolveLiveSessionReminderOffsets(configured: readonly number[] | null | undefined): number[] {
  if (!configured) return [...LIVE_SESSION_REMINDER_DEFAULT_OFFSETS_MINUTES];

  return [...configured];
}
