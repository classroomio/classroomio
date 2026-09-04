import type { LessonVersionDayGroup, LessonVersionEntry } from './types';

/**
 * Buckets a newest-first version list into calendar days, preserving order.
 *
 * A flat list stops being readable well before a well-edited lesson runs out of
 * history, so the panel groups entries under day headers the way every editor
 * with version history does.
 */
export function groupVersionsByDay(versions: LessonVersionEntry[]): LessonVersionDayGroup[] {
  const groups: LessonVersionDayGroup[] = [];

  for (const version of versions) {
    const dayStart = new Date(version.timestamp);
    dayStart.setHours(0, 0, 0, 0);

    const dayKey = dayStart.getTime();
    const openGroup = groups.at(-1);

    if (openGroup?.dayKey === dayKey) {
      openGroup.versions.push(version);
      continue;
    }

    groups.push({ dayKey, versions: [version] });
  }

  return groups;
}

/**
 * Which relative label a day header should use. Today and yesterday read better
 * as words; anything older gets a formatted date instead.
 */
export function getRelativeDayLabelKey(dayKey: number, now: Date = new Date()): 'today' | 'yesterday' | null {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const dayStart = new Date(dayKey);
  dayStart.setHours(0, 0, 0, 0);

  const daysAgo = Math.round((todayStart.getTime() - dayStart.getTime()) / 86_400_000);
  if (daysAgo === 0) return 'today';
  if (daysAgo === 1) return 'yesterday';

  return null;
}

/**
 * Whether a session spanned enough time to be worth showing as a range rather
 * than a single instant. Sub-minute sessions are a single save in practice.
 */
export function hasVersionSessionSpan(version: LessonVersionEntry): boolean {
  return version.timestamp.getTime() - version.sessionStartedAt.getTime() >= 60_000;
}
