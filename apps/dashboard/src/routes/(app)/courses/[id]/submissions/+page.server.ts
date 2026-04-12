import type { ListSubmissionsForGradingSuccess } from '$features/course/utils/types';
import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';

  if (!courseId) {
    return {
      courseId: '',
      sections: [],
      submissionIdData: {}
    };
  }

  const result = await safeServerApi<ListSubmissionsForGradingSuccess>(() =>
    classroomio.course[':courseId'].submission['for-grading'].$get(
      {
        param: { courseId }
      },
      getApiHeaders(cookies)
    )
  );

  if (result.ok && result.body.data) {
    return {
      courseId,
      sections: result.body.data.sections || [],
      submissionIdData: result.body.data.submissionIdData || {}
    };
  }

  return {
    courseId,
    sections: [],
    submissionIdData: {}
  };
};
