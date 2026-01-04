import type { CourseAnalytics } from '$features/course/utils/types';
import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies, parent }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      course: null,
      courseId: '',
      courseAnalytics: null
    };
  }

  // Get course data from parent layout (already loaded)
  const { course } = await parent();
  if (!course) {
    return {
      course: null,
      courseId,
      courseAnalytics: null
    };
  }

  // Fetch analytics using single API call
  const response = await classroomio.course[':courseId']['analytics'].$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies, '')
  );

  const data = await response.json();
  const courseAnalytics: CourseAnalytics | null = data.success && data.data ? data.data : null;

  return {
    course,
    courseId,
    courseAnalytics
  };
};
