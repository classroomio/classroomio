import { readable } from 'svelte/store';
import { ContentType } from '@cio/utils/constants/content';
import { getLiveSessionPhase, type LiveSessionTiming } from '@cio/utils/functions/live-session';

const CLOCK_TICK_MS = 30_000;

export const liveSessionClock = readable(Date.now(), (set) => {
  set(Date.now());
  const ticker = setInterval(() => set(Date.now()), CLOCK_TICK_MS);

  return () => clearInterval(ticker);
});

export function isLiveSessionLive(session: LiveSessionTiming, now: number): boolean {
  return getLiveSessionPhase(session, now) === 'live';
}

/**
 * A meeting link stays joinable until its scheduled session ends. Links without a start time are always joinable.
 */
export function isLiveSessionJoinable(session: LiveSessionTiming, now: number): boolean {
  if (!session.callUrl) return false;

  return getLiveSessionPhase(session, now) !== 'ended';
}

/**
 * Lessons whose live session has ended, most recent first.
 */
export function getPastLiveSessions<T extends LiveSessionTiming & { type: string }>(items: T[], now: number): T[] {
  return items
    .filter((item) => item.type === ContentType.Lesson && getLiveSessionPhase(item, now) === 'ended')
    .sort((a, b) => new Date(b.lessonAt!).getTime() - new Date(a.lessonAt!).getTime());
}
