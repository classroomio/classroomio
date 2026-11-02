import { useState } from 'react';

import { CourseActionBar } from '@/feature/course/components/course-action-bar';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

import {
  LessonActionNote,
  LessonActionRow,
  LessonCompleteButton,
  LessonCompletedStatus,
  LessonNextButton,
  LessonWatchProgress
} from './lesson-action-bar';

type LessonBottomBarProps = {
  policy: string;
  complete: boolean;
  threshold: number | null;
  watchedPercent: number | null;
  next: CourseContentItem | null;
  nextLockReason: string | null;
  pending: boolean;
  syncPending: boolean;
  onComplete: () => void;
  onUndo: () => void;
  onNext: (item: CourseContentItem) => void;
};

/** The pinned bar for this lesson's completion policy, composed from the lesson action bar parts. */
export function LessonBottomBar({
  policy,
  complete,
  threshold,
  watchedPercent,
  next,
  nextLockReason,
  pending,
  syncPending,
  onComplete,
  onUndo,
  onNext
}: LessonBottomBarProps) {
  const t = useTranslations(lessonCatalog);
  const [completeOnOpen] = useState(complete);
  const nextButton = next ? (
    <LessonNextButton next={next} emphasized={complete} lockReason={nextLockReason} onNext={onNext} />
  ) : null;

  if (complete) {
    return (
      <CourseActionBar>
        <LessonActionRow>
          <LessonCompletedStatus
            animate={!completeOnOpen}
            syncPending={syncPending}
            undoable={policy === 'manual' && !syncPending}
            pending={pending}
            detail={next ? (nextLockReason ?? next.title) : t('completedLabel')}
            onUndo={onUndo}
          />
          {nextButton}
        </LessonActionRow>
      </CourseActionBar>
    );
  }

  if (policy === 'manual') {
    return (
      <CourseActionBar>
        <LessonCompleteButton hasNext={Boolean(next)} pending={pending} onComplete={onComplete} />
      </CourseActionBar>
    );
  }

  if (policy === 'video_watch') {
    return (
      <CourseActionBar>
        <LessonActionRow>
          <LessonWatchProgress threshold={threshold} watchedPercent={watchedPercent} />
          {nextButton}
        </LessonActionRow>
      </CourseActionBar>
    );
  }

  if (!next) return null;

  return (
    <CourseActionBar>
      <LessonActionRow>
        <LessonActionNote>{nextLockReason ?? next.title}</LessonActionNote>
        {nextButton}
      </LessonActionRow>
    </CourseActionBar>
  );
}
