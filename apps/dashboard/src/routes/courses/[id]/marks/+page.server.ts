import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import type { MarksPageData } from '$features/course/utils/marks-utils';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      courseId: '',
      marksData: null
    };
  }

  const response = await classroomio.course[':courseId'].mark.gradebook.$get(
    { param: { courseId } },
    getApiHeaders(cookies, '')
  );

  const json = await response.json();
  const marksData: MarksPageData | null = json.success && json.data ? (json.data as MarksPageData) : null;

  return {
    courseId,
    marksData
  };
};
