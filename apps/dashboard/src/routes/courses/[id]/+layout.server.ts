import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      course: null,
      courseId: ''
    };
  }

  // Fetch course data server-side
  const response = await classroomio.course[':courseId'].$get(
    {
      param: { courseId },
      query: {}
    },
    getApiHeaders(cookies, '')
  );

  const data = await response.json();
  const course = data.success && data.data ? data.data : null;

  return {
    course,
    courseId
  };
};
