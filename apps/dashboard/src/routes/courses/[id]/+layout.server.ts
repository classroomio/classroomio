import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies, parent }) => {
  const { org } = await parent();
  const courseId = params.id || '';

  if (!courseId || !org?.id) {
    return {
      course: null,
      courseId: ''
    };
  }

  // Fetch course data server-side
  const response = await classroomio.course[':courseId'].$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies, org.id)
  );

  const data = await response.json();
  const course = data.success && data.data ? data.data : null;

  return {
    course,
    courseId
  };
};
