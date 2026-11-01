import { getLiveSessionPhase } from '@cio/utils/functions/live-session';

import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { findItem } from '@/feature/course/helpers/course-content';
import { formatDay, formatSessionTime } from '@/feature/course/helpers/format-date';
import type { en } from '@/feature/course/translations/en';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

type CourseTranslator = Translator<typeof en>;

/** The reason a locked item gives, naming the item it waits on when the API reports one. */
export function lockReasonOf(item: CourseContentItem, items: CourseContentItem[], t: CourseTranslator) {
  if (item.lockReason === 'teacher_locked') return t('lockedByInstructor');

  const blocker = item.blockedById ? findItem(items, item.blockedById) : null;
  if (blocker?.title) return t('completeItemToUnlock', { title: blocker.title });

  return t('completePreviousToUnlock');
}

export function liveSessionPhaseOf(item: Pick<CourseContentItem, 'callUrl' | 'lessonAt' | 'sessionDurationMinutes'>) {
  const startTime = item.lessonAt ? parseTimestamp(item.lessonAt) : Number.NaN;

  return getLiveSessionPhase({
    callUrl: item.callUrl,
    lessonAt: Number.isFinite(startTime) ? new Date(startTime).toISOString() : null,
    sessionDurationMinutes: item.sessionDurationMinutes
  });
}

export function liveSessionLabel(
  item: Pick<CourseContentItem, 'callUrl' | 'lessonAt' | 'sessionDurationMinutes'>,
  t: CourseTranslator,
  locale: Locale
) {
  const phase = liveSessionPhaseOf(item);
  if (!phase || !item.lessonAt) return null;
  if (phase === 'live') return t('liveNow');
  if (phase === 'ended') return t('sessionEndedAt', { time: formatSessionTime(item.lessonAt, locale) });

  return t('liveAt', { time: formatSessionTime(item.lessonAt, locale) });
}

export function lessonKindLabel(item: CourseContentItem, t: CourseTranslator) {
  if ((item.videosCount ?? 0) > 0) return t('kindVideo');
  if (item.hasSlideContent) return t('kindSlides');
  if ((item.documentsCount ?? 0) > 0) return t('kindDocument');
  if (item.callUrl) return t('kindLiveSession');

  return t('kindReading');
}

export function exerciseDetail(item: CourseContentItem, t: CourseTranslator, locale: Locale) {
  const parts = [t('kindExercise')];
  if (item.questionCount) parts.push(t('questionCount', { count: item.questionCount }));
  if (item.dueBy && !item.isComplete) parts.push(t('dueOn', { date: formatDay(item.dueBy, locale) }));

  return parts.join(' · ');
}
