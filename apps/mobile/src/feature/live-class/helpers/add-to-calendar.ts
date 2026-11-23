import { createEventInCalendarAsync } from 'expo-calendar/legacy';

import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import type { LiveClass } from '@/feature/live-class/types/live-class';

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

/** Opens the system's new-event sheet prefilled with the live class; the learner saves or cancels it there. */
export async function addLiveClassToCalendar(liveClass: LiveClass) {
  const startDate = new Date(parseTimestamp(liveClass.startsAt));
  const endTime = liveClass.endsAt ? parseTimestamp(liveClass.endsAt) : Number.NaN;
  const endDate = Number.isFinite(endTime) ? new Date(endTime) : new Date(startDate.getTime() + DEFAULT_DURATION_MS);

  return createEventInCalendarAsync({
    title: liveClass.title,
    notes: liveClass.course.title,
    startDate,
    endDate,
    timeZone: liveClass.sessionTimezone ?? undefined
  });
}
