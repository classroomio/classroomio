import type { en } from '@/feature/downloads/translations/en';
import type { CourseDownload } from '@/feature/downloads/types/downloads';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

import { formatBytes } from './format-bytes';

export function courseDownloadSummary(course: CourseDownload, t: Translator<typeof en>, locale: Locale) {
  const done = course.lessons.filter((lesson) => lesson.status === 'complete').length;
  const total = course.lessons.length;
  const lessonsDone = t('lessonsDone', { done, count: total });

  switch (course.status) {
    case 'complete':
      return `${t('lessonCount', { count: total })} · ${formatBytes(course.bytes, locale)}`;
    case 'downloading':
      return course.expectedBytes > 0
        ? `${t('bytesOfTotal', { done: formatBytes(course.bytes, locale), total: formatBytes(course.expectedBytes, locale) })} · ${lessonsDone}`
        : lessonsDone;
    case 'waiting':
      return course.waitReason === 'wifi' ? t('waitingForWifi') : t('waitingForConnection');
    case 'queued':
      return t('queued');
    case 'paused':
      return `${t('paused')} · ${lessonsDone}`;
    case 'failed':
      return t('lessonsFailed', { count: course.lessons.filter((lesson) => lesson.status === 'failed').length });
  }
}

export function courseDownloadPercent(course: CourseDownload) {
  if (course.status === 'complete') return 100;
  if (course.expectedBytes > 0) return Math.min(99, (course.bytes / course.expectedBytes) * 100);

  const done = course.lessons.filter((lesson) => lesson.status === 'complete').length;

  return course.lessons.length > 0 ? (done / course.lessons.length) * 100 : 0;
}
