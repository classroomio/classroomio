import { ContentType } from '@cio/utils/constants/content';
import { router } from 'expo-router';

import type { CourseContentItem } from '@/feature/course/types/course-detail';

export type LessonDirection = 'previous' | 'next';

/** Route param that makes the replaced screen animate like a pop when the learner moves back. */
export const BACKWARD_PARAM = 'from';

/** Replaces the current lesson or exercise with its neighbour in the course, animating in the direction of travel. */
export function openNeighbor(
  courseId: string,
  item: Pick<CourseContentItem, 'id' | 'type'>,
  direction: LessonDirection
) {
  const backward = direction === 'previous' ? { [BACKWARD_PARAM]: 'next' } : {};

  if (item.type === ContentType.Exercise) {
    router.replace({
      pathname: '/course/[courseId]/exercise/[exerciseId]',
      params: { courseId, exerciseId: item.id, ...backward }
    });
    return;
  }

  router.replace({
    pathname: '/course/[courseId]/lesson/[lessonId]',
    params: { courseId, lessonId: item.id, ...backward }
  });
}

/** `animationTypeForReplace` for a screen opened by `openNeighbor`. */
export function replaceAnimationOf(from: string | string[] | undefined) {
  return from === 'next' ? ('pop' as const) : ('push' as const);
}
