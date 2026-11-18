import type { GetExerciseSuccess, ListExerciseSubmissionsSuccess } from '$features/course/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ params, cookies }) => {
  const courseId = params.courseId || '';
  const exerciseId = params.exerciseId || '';
  const publicId = params.publicId || '';

  if (!courseId || !exerciseId) {
    console.log('courseId', courseId, 'exerciseId', exerciseId);
    return { courseId, exerciseId, publicId, exercise: null, submissions: [], mySubmissions: [] };
  }

  const headers = getApiHeaders(cookies);

  const [exerciseResult, overviewResult] = await Promise.all([
    safeServerApi<GetExerciseSuccess>(() =>
      classroomio.course[':courseId'].exercise[':exerciseId'].$get({ param: { courseId, exerciseId } }, headers)
    ),
    safeServerApi<ListExerciseSubmissionsSuccess>(() =>
      classroomio.course[':courseId'].exercise[':exerciseId']['submissions'].$get(
        { param: { courseId, exerciseId } },
        headers
      )
    )
  ]);
  const exercise = exerciseResult.ok && exerciseResult.body.data ? exerciseResult.body.data : null;
  const overview =
    overviewResult.ok && overviewResult.body.data ? overviewResult.body.data : { mySubmission: [], allSubmissions: [] };

  const mySubmissionData = Array.isArray(overview.mySubmission) ? overview.mySubmission : [];
  const mySubmissions = mySubmissionData;

  const submissions = Array.isArray(overview.allSubmissions) ? overview.allSubmissions : [];
  console.log('submissions', submissions.length, 'mySubmissions', mySubmissions.length);

  return {
    courseId,
    exerciseId,
    publicId,
    exercise,
    submissions,
    mySubmissions
  };
};
