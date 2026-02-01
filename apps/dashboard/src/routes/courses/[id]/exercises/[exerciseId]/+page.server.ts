import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const exerciseId = params.exerciseId || '';

  if (!courseId || !exerciseId) {
    return { courseId, exerciseId, exercise: null };
  }

  const response = await classroomio.course[':courseId'].exercise[':exerciseId'].$get(
    { param: { courseId, exerciseId } },
    getApiHeaders(cookies)
  );

  const result = await response.json();

  const exercise = result.success && result.data ? result.data : null;

  return {
    courseId,
    exerciseId,
    exercise: exercise
  };
};
