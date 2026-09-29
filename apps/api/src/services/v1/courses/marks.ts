import type { TPublicApiCourseMarksQuery, TPublicApiCourseParam } from '@cio/utils/validation/public-api';
import { getGradebook } from '@api/services/mark/gradebook';
import {
  assertAutomationActor,
  assertCourseBelongsToOrganization,
  assertCourseMemberOrOrgAdmin,
  paginateInMemory
} from '../shared';

/**
 * The course gradebook, one row per student. Uses the dashboard's `getGradebook`, so a student actor only gets their
 * own row, as in the dashboard.
 */
export async function getCourseMarksService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseMarksQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseMemberOrOrgAdmin(params.courseId, actorId);
  assertAutomationActor(actorId);

  const { students, exercises, studentMarksByExerciseId } = await getGradebook(params.courseId, actorId);

  const rows = students
    .map((student) => {
      const studentMarks = studentMarksByExerciseId[student.id] ?? {};

      return {
        memberId: student.id,
        profileId: student.profileId,
        fullname: student.profile?.fullname ?? null,
        email: student.profile?.email ?? student.email ?? null,
        marks: exercises.map((exercise) => ({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          maxPoints: exercise.points,
          points: studentMarks[exercise.id] !== undefined ? Number(studentMarks[exercise.id]) : null
        }))
      };
    })
    .sort((a, b) => (a.fullname ?? '').localeCompare(b.fullname ?? '') || a.memberId.localeCompare(b.memberId));

  return paginateInMemory(rows, query);
}
