import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

import type { GetUserCourseAnalyticsSuccess, UserCourseAnalytics } from '$features/course/utils/types';

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
    const result = await safeServerApi<GetUserCourseAnalyticsSuccess>(() =>
      classroomio.course[':courseId']['members'][':userId']['analytics'].$get(
        {
          param: { courseId, userId }
        },
        getApiHeaders(cookies, '')
      )
    );
    const userCourseAnalytics: UserCourseAnalytics | null = result.ok && result.body.data ? result.body.data : null;

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
