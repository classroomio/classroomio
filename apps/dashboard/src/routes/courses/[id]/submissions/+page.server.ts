import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { course, courseId: layoutCourseId } = await parent();
  const courseId = params.id || layoutCourseId;

  if (!courseId) {
    return {
      course: null,
      courseId: '',
      sections: [],
      submissionIdData: {}
    };
  }

  // Get organization ID from course or context
  const orgId = course?.organizationId || '';

  // Fetch pre-processed submission data server-side
  const response = await classroomio.course[':courseId'].submission['for-grading'].$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies, orgId)
  );

  const result = await response.json();

  if (result.success && result.data) {
    return {
      course,
      courseId,
      sections: result.data.sections || [],
      submissionIdData: result.data.submissionIdData || {}
    };
  }

  return {
    course,
    courseId,
    sections: [],
    submissionIdData: {}
  };
};
