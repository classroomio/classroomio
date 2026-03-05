import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  const exerciseId = params.exerciseId || '';

  if (!courseId || !exerciseId) {
    return { courseId, exerciseId, exercise: null, submissions: [], mySubmission: null };
  }

  const headers = getApiHeaders(cookies);

  const [exerciseResponse, overviewResponse] = await Promise.all([
    classroomio.course[':courseId'].exercise[':exerciseId'].$get({ param: { courseId, exerciseId } }, headers),
    classroomio.course[':courseId'].exercise[':exerciseId']['submissions'].$get(
      { param: { courseId, exerciseId } },
      headers
    )
  ]);

  const exerciseResult = await exerciseResponse.json();
  const exercise = exerciseResult.success && exerciseResult.data ? exerciseResult.data : null;

  const overviewResult = await overviewResponse.json();
  const overview =
    overviewResult.success && overviewResult.data ? overviewResult.data : { mySubmission: [], allSubmissions: [] };

  const mySubmissionData = Array.isArray(overview.mySubmission) ? overview.mySubmission : [];
  const mySubmission = mySubmissionData.length > 0 ? mySubmissionData[0] : null;

  const submissions = Array.isArray(overview.allSubmissions) ? overview.allSubmissions : [];

  return {
    courseId,
    exerciseId,
    exercise,
    submissions,
    mySubmission
  };
};
