import { DEFAULT_SESSION_DURATION_MINUTES } from '@cio/utils/functions/live-session';

import { parseTimestamp } from '@/feature/common/helpers/time-ago';

const MINUTE = 60 * 1000;
const OPENS_BEFORE_START_MINUTES = 15;

/** True from shortly before a session starts until it ends: when a learner can expect a check-in code. */
export function isCheckInWindowOpen(lessonAt: string | null, sessionDurationMinutes: number | null, now = Date.now()) {
  if (!lessonAt) return false;

  const start = parseTimestamp(lessonAt);
  if (!Number.isFinite(start)) return false;

  const end = start + (sessionDurationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES) * MINUTE;

  return now >= start - OPENS_BEFORE_START_MINUTES * MINUTE && now < end;
}

/** Minutes and seconds until `expiresAt` as "m:ss", or null once it has passed. */
export function countdownOf(expiresAt: string, now = Date.now()) {
  const remaining = parseTimestamp(expiresAt) - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds, label: `${minutes}:${String(seconds).padStart(2, '0')}` };
}
