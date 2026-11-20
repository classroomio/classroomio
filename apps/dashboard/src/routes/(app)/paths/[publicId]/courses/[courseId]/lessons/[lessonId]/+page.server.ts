import type { GetLessonSuccess } from '$features/course/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ params, cookies }) => {
  const courseId = params.courseId || '';
  const lessonId = params.lessonId || '';
  const publicId = params.publicId || '';

  if (!courseId || !lessonId) {
    return { courseId, lessonId, publicId, lesson: null };
  }

  const result = await safeServerApi<GetLessonSuccess>(() =>
    classroomio.course[':courseId'].lesson[':lessonId'].$get({ param: { courseId, lessonId } }, getApiHeaders(cookies))
  );
  const lesson = result.ok ? result.body.data : null;

  return {
    courseId,
    lessonId,
    publicId,
    lesson: lesson
  };
};
