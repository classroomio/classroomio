import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const lessonId = params.lessonId || '';

  if (!courseId || !lessonId) {
    return { courseId, lessonId, lesson: null };
  }

  const response = await classroomio.course[':courseId'].lesson[':lessonId'].$get(
    { param: { courseId, lessonId } },
    getApiHeaders(cookies)
  );

  const result = await response.json();

  const lesson = result.success && result.data ? result.data : null;

  return {
    courseId,
    lessonId,
    lesson: lesson
  };
};
