import { ContentType } from '@cio/utils/constants/content';
import { t } from '$lib/utils/functions/translations';

export type LessonCompletionState = {
  isLessonComplete: boolean;
  isLessonLocked: boolean;
  isVideoWatchLesson: boolean;
  canToggleCompletion: boolean;
};

type CompletionContentItem = {
  id: string;
  type: string;
  isComplete?: boolean;
  completionPolicy?: string | null;
};

function isVideoWatchPolicy(
  lessonId: string | null | undefined,
  loadedLesson: { id?: string | null; completionPolicy?: string | null } | null | undefined,
  contentCompletionPolicy: string | null | undefined
): boolean {
  if (!lessonId) {
    return false;
  }

  if (loadedLesson?.id === lessonId) {
    return loadedLesson.completionPolicy === 'video_watch';
  }

  return contentCompletionPolicy === 'video_watch';
}

export function getLessonCompletionState(input: {
  contentItem: CompletionContentItem | null | undefined;
  isLearnerView: boolean;
  lockReason: string | null | undefined;
  loadedLesson?: { id?: string | null; completionPolicy?: string | null } | null;
}): LessonCompletionState {
  const isLesson = input.contentItem?.type === ContentType.Lesson;
  const isLessonLocked = input.isLearnerView && input.lockReason != null;
  const isVideoWatchLesson = isVideoWatchPolicy(
    input.contentItem?.id,
    input.loadedLesson,
    input.contentItem?.completionPolicy
  );

  return {
    isLessonComplete: input.contentItem?.isComplete ?? false,
    isLessonLocked,
    isVideoWatchLesson,
    canToggleCompletion: Boolean(isLesson && !isLessonLocked && !isVideoWatchLesson)
  };
}

export function getLessonCompletionToggleLabel(isComplete: boolean): string {
  const markAs = t.get('course.navItem.lessons.mark_as');
  const stateKey = isComplete ? 'course.navItem.lessons.incomplete' : 'course.navItem.lessons.complete';

  return `${markAs} ${t.get(stateKey)}`;
}
