import type { CourseAnalytics } from '$features/course/utils/types';
import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      courseId: '',
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
    courseId,
    courseAnalytics
  };
};
