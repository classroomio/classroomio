/** Postgres `ATTENDANCE_STATUS` enum values, shared by the Drizzle schema and Zod validation. */
export const ATTENDANCE_STATUS_VALUES = ['present', 'absent', 'late'] as const;

export type TAttendanceStatus = (typeof ATTENDANCE_STATUS_VALUES)[number];

export const CHECK_IN_CODE_LENGTH = 6;

/** Excludes characters that read alike: 0/O, 1/I/L. */
export const CHECK_IN_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const CHECK_IN_CODE_TTL_MINUTES = 15;

export const CHECK_IN_LATE_AFTER_MINUTES = 10;

export function isPresentForAttendanceStatus(status: TAttendanceStatus): boolean {
  return status !== 'absent';
}
