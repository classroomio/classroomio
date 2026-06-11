import { ContentType } from '@cio/utils/constants/content';
import type { Course } from './types';
import { syncProgressionAccessToCourse } from './progression-utils';

export function updateLessonCompletionInCourseContent(course: Course, lessonId: string, isComplete: boolean): Course {
  if (!course.content) return course;

  let updatedCourse: Course;

  if (course.content.grouped) {
    updatedCourse = {
      ...course,
      content: {
        ...course.content,
        sections: course.content.sections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.type === ContentType.Lesson && item.id === lessonId ? { ...item, isComplete } : item
          )
        }))
      }
    };
  } else {
    updatedCourse = {
      ...course,
      content: {
        ...course.content,
        items: course.content.items.map((item) =>
          item.type === ContentType.Lesson && item.id === lessonId ? { ...item, isComplete } : item
        )
      }
    };
  }

  return syncProgressionAccessToCourse(updatedCourse);
}
