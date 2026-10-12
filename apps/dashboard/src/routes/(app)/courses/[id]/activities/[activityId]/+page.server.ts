import type { GetActivitySuccess } from '$features/course/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const activityId = params.activityId || '';

  if (!courseId || !activityId) {
    return { courseId, activityId, activity: null };
  }

  const result = await safeServerApi<GetActivitySuccess>(() =>
    classroomio.course[':courseId'].activity[':activityId'].$get(
      { param: { courseId, activityId } },
      getApiHeaders(cookies)
    )
  );
  const activity = result.ok ? result.body.data : null;

  return {
    courseId,
    activityId,
    activity: activity
  };
};
