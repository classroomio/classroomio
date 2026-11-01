import { useMemo } from 'react';

import { ApiError } from '@/feature/common/api/request';
import { lockReasonOf } from '@/feature/course/helpers/content-copy';
import { findItem, neighborsOf } from '@/feature/course/helpers/course-content';
import { useCourseOutline } from '@/feature/course/helpers/use-course-outline';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useTutorStatusQuery } from '@/feature/lesson/api/ai-tutor';
import { useLessonQuery } from '@/feature/lesson/api/lesson';
import { useTranscriptQuery } from '@/feature/lesson/api/media';
import { lessonBody, useLessonLocale } from '@/feature/lesson/helpers/lesson-locale';
import { lessonVideoSources, transcriptAssetIdOf } from '@/feature/lesson/helpers/lesson-media';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { SlideDeck } from '@/feature/lesson/types/lesson';
import type { TutorUnavailableReason } from '@/feature/lesson/types/tutor';

export function useLessonPlayer(courseId: string, lessonId: string) {
  const lesson = useLessonQuery(courseId, lessonId);
  const { course, outline } = useCourseOutline(courseId);
  const tutorStatus = useTutorStatusQuery(courseId);
  const locale = useLessonLocale();
  const t = useTranslations(lessonCatalog);
  const courseT = useTranslations(courseCatalog);

  const item = outline ? findItem(outline.items, lessonId) : null;
  const { previous, next, index } = outline
    ? neighborsOf(outline.items, lessonId)
    : { previous: null, next: null, index: -1 };

  const videos = useMemo(
    () => lessonVideoSources(lesson.data?.videos, (number) => t('videoNumbered', { number })),
    [lesson.data?.videos, t]
  );
  const primary = videos[0] ?? null;
  const transcriptAssetId = primary ? transcriptAssetIdOf(primary.source, primary.video) : null;
  const transcript = useTranscriptQuery(transcriptAssetId);

  const body = lesson.data ? lessonBody(lesson.data, locale) : null;
  const slides = useMemo(() => {
    const decks: SlideDeck[] = (lesson.data?.slides ?? []).map((slide) => ({
      id: slide.id,
      src: slide.src,
      platform: slide.platform
    }));
    const legacy = lesson.data?.slideUrl?.trim();
    if (legacy && !decks.some((deck) => deck.src === legacy))
      decks.unshift({ id: 'slide-url', src: legacy, platform: null });

    return decks;
  }, [lesson.data?.slides, lesson.data?.slideUrl]);

  const locked = (lesson.error instanceof ApiError && lesson.error.status === 403) || item?.accessible === false;
  const lockReason = item && outline ? lockReasonOf(item, outline.items, courseT) : t('lockedFallbackReason');

  const section = outline?.sections.find((entry) => entry.items.some((entry) => entry.id === lessonId)) ?? null;
  const position =
    outline && index >= 0
      ? [section?.title, t('positionOfTotal', { index: index + 1, total: outline.items.length })]
          .filter(Boolean)
          .join(' · ')
      : null;

  const tutor = tutorStatus.data;
  const tutorEnabled = Boolean(tutor?.enabled && tutor.tutor.enabled);
  const allowance =
    tutor?.tutor.enforced && tutor.tutor.cap !== null && tutor.tutor.capRemaining !== null
      ? { remaining: tutor.tutor.capRemaining, cap: tutor.tutor.cap }
      : null;
  const tutorUnavailable: TutorUnavailableReason | null = !tutor
    ? null
    : !tutor.enabled
      ? 'not_configured'
      : !tutor.tutor.enabled
        ? 'disabled'
        : null;

  return {
    lesson,
    course,
    outline,
    item,
    previous,
    next,
    position,
    locked,
    lockReason,
    body,
    videos,
    slides,
    transcript: transcript.data?.segments.length ? transcript.data : null,
    tutor: { enabled: tutorEnabled, allowance, unavailable: tutorUnavailable }
  };
}
