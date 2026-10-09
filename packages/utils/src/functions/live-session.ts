export const DEFAULT_SESSION_DURATION_MINUTES = 60;
export const MIN_SESSION_DURATION_MINUTES = 15;
export const MAX_SESSION_DURATION_MINUTES = 480;

export type LiveSessionPhase = 'upcoming' | 'live' | 'ended';

export type LiveSessionTiming = {
  callUrl: string | null | undefined;
  lessonAt: string | null | undefined;
  sessionDurationMinutes?: number | null;
};

/**
 * Where a scheduled live session sits relative to `now`, or null when the lesson has no call link or start time.
 */
export function getLiveSessionPhase(session: LiveSessionTiming, now: number = Date.now()): LiveSessionPhase | null {
  if (!session.callUrl || !session.lessonAt) return null;

  const startMs = new Date(session.lessonAt).getTime();
  if (Number.isNaN(startMs)) return null;

  const durationMinutes = session.sessionDurationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES;
  const endMs = startMs + durationMinutes * 60_000;

  if (now < startMs) return 'upcoming';
  if (now < endMs) return 'live';

  return 'ended';
}

/**
 * The recording link students may see: only once the session has ended.
 */
export function getReleasedRecordingUrl(
  session: LiveSessionTiming & { recordingUrl: string | null | undefined },
  now: number = Date.now()
): string | null {
  if (!session.recordingUrl) return null;

  return getLiveSessionPhase(session, now) === 'ended' ? session.recordingUrl : null;
}
