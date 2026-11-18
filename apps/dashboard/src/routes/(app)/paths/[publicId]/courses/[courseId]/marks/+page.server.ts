import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { MarksPageData } from '$features/course/utils/marks-utils';

export const load = async ({ params, cookies }) => {
  const courseId = params.courseId || '';
  const publicId = params.publicId || '';
  if (!courseId) {
    return {
      courseId: '',
      publicId,
      marksData: null
    };
  }

  const result = await safeServerApi<{ success: true; data: MarksPageData }>(() =>
    classroomio.course[':courseId'].mark.gradebook.$get({ param: { courseId } }, getApiHeaders(cookies, ''))
  );
  const marksData: MarksPageData | null = result.ok ? result.body.data : null;

  return {
    courseId,
    publicId,
    marksData
  };
};
