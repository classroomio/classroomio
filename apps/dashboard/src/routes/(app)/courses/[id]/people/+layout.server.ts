import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

import type { GetUserCourseAnalyticsSuccess, UserCourseAnalytics } from '$features/course/utils/types';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const personId = params.personId || '';

  if (!courseId || !personId) {
    return {
      courseId,
      personId,
      userCourseAnalytics: null
    };
  }

  try {
    const result = await safeServerApi<GetUserCourseAnalyticsSuccess>(() =>
      classroomio.course[':courseId']['members'][':userId']['analytics'].$get(
        {
          param: { courseId, userId: personId }
        },
        getApiHeaders(cookies, '')
      )
    );
    const userCourseAnalytics: UserCourseAnalytics | null = result.ok && result.body.data ? result.body.data : null;

    return {
      courseId,
      personId,
      userCourseAnalytics
    };
  } catch (error) {
    console.error('Failed to fetch user course analytics:', error);
    return {
      courseId,
      personId,
      userCourseAnalytics: null
    };
  }
};
