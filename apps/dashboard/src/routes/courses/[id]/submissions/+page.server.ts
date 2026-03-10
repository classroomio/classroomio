import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';

  if (!courseId) {
    return {
      courseId: '',
      sections: [],
      submissionIdData: {}
    };
  }

  // Fetch pre-processed submission data server-side
  const response = await classroomio.course[':courseId'].submission['for-grading'].$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies)
  );

  const result = await response.json();

  if (result.success && result.data) {
    return {
      courseId,
      sections: result.data.sections || [],
      submissionIdData: result.data.submissionIdData || {}
    };
  }

  return {
    courseId,
    sections: [],
    submissionIdData: {}
  };
};
