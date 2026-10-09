import { readable } from 'svelte/store';
import { ContentType } from '@cio/utils/constants/content';
import { getLiveSessionPhase, type LiveSessionTiming } from '@cio/utils/functions/live-session';

const CLOCK_TICK_MS = 30_000;

export const liveSessionClock = readable(Date.now(), (set) => {
  const ticker = setInterval(() => set(Date.now()), CLOCK_TICK_MS);

  return () => clearInterval(ticker);
});

export function isLiveSessionLive(session: LiveSessionTiming, now: number): boolean {
  return getLiveSessionPhase(session, now) === 'live';
}

export function isLiveSessionJoinable(session: LiveSessionTiming, now: number): boolean {
  const phase = getLiveSessionPhase(session, now);

  return phase === 'upcoming' || phase === 'live';
}

/**
 * Lessons whose live session has ended, most recent first.
 */
export function getPastLiveSessions<T extends LiveSessionTiming & { type: string }>(items: T[], now: number): T[] {
  return items
    .filter((item) => item.type === ContentType.Lesson && getLiveSessionPhase(item, now) === 'ended')
    .sort((a, b) => new Date(b.lessonAt!).getTime() - new Date(a.lessonAt!).getTime());
}
