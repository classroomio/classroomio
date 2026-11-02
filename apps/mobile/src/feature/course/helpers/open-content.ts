import { ContentType } from '@cio/utils/constants/content';
import { router } from 'expo-router';

import type { CourseContentItem } from '@/feature/course/types/course-detail';

export function openContentItem(
  courseId: string,
  item: Pick<CourseContentItem, 'id' | 'type'>,
  mode: 'push' | 'replace' = 'push'
) {
  const href =
    item.type === ContentType.Exercise
      ? ({ pathname: '/course/[courseId]/exercise/[exerciseId]', params: { courseId, exerciseId: item.id } } as const)
      : ({ pathname: '/course/[courseId]/lesson/[lessonId]', params: { courseId, lessonId: item.id } } as const);

  if (mode === 'replace') router.replace(href);
  else router.push(href);
}
