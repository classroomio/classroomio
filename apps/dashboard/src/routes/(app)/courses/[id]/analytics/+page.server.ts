import type { CourseAnalytics } from '$features/course/utils/types';
import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      courseId: '',
      courseAnalytics: null
    };
  }

  // Fetch analytics using single API call
  const result = await safeServerApi<{ success: true; data: CourseAnalytics }>(() =>
    classroomio.course[':courseId']['analytics'].$get(
      {
        param: { courseId }
      },
      getApiHeaders(cookies, '')
    )
  );
  const courseAnalytics: CourseAnalytics | null = result.ok ? result.body.data : null;

  return {
    courseId,
    courseAnalytics
  };
};
