import { ContentType } from '@cio/utils/constants/content';
import { useMemo } from 'react';

import { useCourseDetailQuery } from '@/feature/course/api/course-detail';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { currentItem, navigableItems, outlineSections } from '@/feature/course/helpers/course-content';

export function useCourseOutline(courseId: string) {
  const course = useCourseDetailQuery(courseId);
  const enrolled = useEnrolledCoursesQuery();

  const outline = useMemo(() => {
    if (!course.data) return null;

    const items = navigableItems(course.data.content);
    const lessons = items.filter((item) => item.type === ContentType.Lesson);
    const exercises = items.filter((item) => item.type === ContentType.Exercise);
    const completed = items.filter((item) => item.isComplete).length;

    return {
      items,
      sections: outlineSections(course.data.content),
      current: currentItem(items),
      lessonCount: lessons.length,
      exerciseCount: exercises.length,
      completed,
      percent: items.length > 0 ? (completed / items.length) * 100 : 0
    };
  }, [course.data]);

  const enrollment = enrolled.data?.find((entry) => entry.id === courseId) ?? null;

  return { course, outline, enrollment };
}
