import { randomInt, timingSafeEqual } from 'node:crypto';

import {
  CHECK_IN_CODE_ALPHABET,
  CHECK_IN_CODE_LENGTH,
  CHECK_IN_LATE_AFTER_MINUTES,
  type TAttendanceStatus
} from '@cio/utils/constants/attendance';

const MS_PER_MINUTE = 60 * 1000;

export function generateCheckInCode(): string {
  let code = '';
  for (let index = 0; index < CHECK_IN_CODE_LENGTH; index += 1) {
    code += CHECK_IN_CODE_ALPHABET[randomInt(CHECK_IN_CODE_ALPHABET.length)];
  }

  return code;
}

export function checkInCodesMatch(expected: string, submitted: string): boolean {
  const expectedBuffer = Buffer.from(expected.toUpperCase());
  const submittedBuffer = Buffer.from(submitted.toUpperCase());
  if (expectedBuffer.length !== submittedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, submittedBuffer);
}

/** `late` once more than the grace window has passed since the session start; `present` otherwise. */
export function checkInStatusAt(lessonAt: string | null, now: Date): Extract<TAttendanceStatus, 'present' | 'late'> {
  if (!lessonAt) return 'present';

  const lateAfter = new Date(lessonAt).getTime() + CHECK_IN_LATE_AFTER_MINUTES * MS_PER_MINUTE;

  return now.getTime() > lateAfter ? 'late' : 'present';
}

/** A check-in never downgrades: a learner already present stays present. */
export function mergeCheckInStatus(
  existing: TAttendanceStatus | null,
  incoming: Extract<TAttendanceStatus, 'present' | 'late'>
): TAttendanceStatus {
  if (existing === 'present') return 'present';

  return incoming;
}

export function buildCheckInQrPayload(lessonId: string, code: string): string {
  const params = new URLSearchParams({ lesson: lessonId, code });

  return `classroomio://check-in?${params.toString()}`;
}
