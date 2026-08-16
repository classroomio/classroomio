import { isPublishedComplianceMissingDeadline } from '@cio/utils/functions';
import { goAndHighlight } from '$lib/routing/go-and-highlight';
import { ROUTE_NAME, ROUTE_SECTIONS } from '$lib/routing/routes';
import type { Course } from './types';

type CourseDeadlineSource = Pick<Course, 'type'> & {
  certificate?: { deadline?: string | null } | null;
};

export function isCourseMissingComplianceDeadline(course: CourseDeadlineSource): boolean {
  return isPublishedComplianceMissingDeadline({
    type: course.type,
    isPublished: true,
    deadline: course.certificate?.deadline
  });
}

export function goToCourseCompletionDeadline(courseId: string) {
  goAndHighlight(ROUTE_NAME.COURSE_SETTINGS, ROUTE_SECTIONS[ROUTE_NAME.COURSE_SETTINGS].COMPLETION_DEADLINE, {
    id: courseId
  });
}
