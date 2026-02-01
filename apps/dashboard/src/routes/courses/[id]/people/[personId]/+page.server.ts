import { classroomio, getApiHeaders } from '$lib/utils/services/api';

import type { UserCourseAnalytics } from '$features/course/utils/types';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const userId = params.personId;

  if (!courseId || !userId) {
    return {
      courseId,
      userId,
      userCourseAnalytics: null
    };
  }

  try {
    const response = await classroomio.course[':courseId']['members'][':userId']['analytics'].$get(
      {
        param: { courseId, userId }
      },
      getApiHeaders(cookies, '')
    );

    const result = await response.json();
    const userCourseAnalytics: UserCourseAnalytics | null = result.success && result.data ? result.data : null;

    return {
      courseId,
      userId,
      userCourseAnalytics
    };
  } catch (error) {
    console.error('Failed to fetch user course analytics:', error);
    return {
      courseId,
      userId,
      userCourseAnalytics: null
    };
  }
};
