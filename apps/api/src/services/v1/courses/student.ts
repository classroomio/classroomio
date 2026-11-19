import { getCourseMember } from '@cio/db/queries/course/people';
import { getLessonById } from '@cio/db/queries/lesson';
import { ContentType, ROLE } from '@cio/utils/constants';
import type {
  TPublicApiCourseStudentExerciseParam,
  TPublicApiCourseStudentLessonParam,
  TPublicApiCreateStudentSubmission,
  TPublicApiSetStudentLessonCompletion
} from '@cio/utils/validation/public-api';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { upsertLessonCompletionService } from '@api/services/lesson';
import { createSubmissionService } from '@api/services/submission';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';
import { assertExerciseBelongsToCourse } from './exercises';
import { toPublicSubmission } from './submissions';
import type { TEventSource } from '@cio/core/services/posthog';

/** Returns the student's member and profile ids; throws unless the actor is course team and the member is a joined student. */
async function resolveStudent(orgId: string, actorId: string | null, courseId: string, memberId: string) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);

  const member = await getCourseMember(courseId, memberId);
  if (!member) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (member.roleId !== ROLE.STUDENT) {
    throw new AppError('Only a student member can be acted for', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!member.profileId) {
    throw new AppError('This member has not accepted their invite yet', ErrorCodes.CONFLICT, 409);
  }

  return { memberId: member.id, profileId: member.profileId };
}

export async function setStudentLessonCompletionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseStudentLessonParam,
  payload: TPublicApiSetStudentLessonCompletion
) {
  const student = await resolveStudent(orgId, actorId, params.courseId, params.memberId);

  const lesson = await getLessonById(params.lessonId);
  if (!lesson || lesson.courseId !== params.courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  await assertEnrolledStudentContentAccess({
    courseId: params.courseId,
    profileId: student.profileId,
    contentId: params.lessonId,
    type: ContentType.Lesson
  });

  const completion = await upsertLessonCompletionService(
    params.lessonId,
    student.profileId,
    payload.isComplete,
    'admin'
  );

  if (payload.isComplete) {
    void evaluateCourseCertification(params.courseId, student.profileId).catch((certError) => {
      console.error('Failed to evaluate course certification after lesson completion:', certError);
    });
  }

  return {
    lessonId: params.lessonId,
    memberId: student.memberId,
    isComplete: completion.isComplete ?? false,
    updatedAt: completion.updatedAt ?? null
  };
}

export async function createStudentSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseStudentExerciseParam,
  payload: TPublicApiCreateStudentSubmission,
  source: TEventSource = 'public_api'
) {
  const student = await resolveStudent(orgId, actorId, params.courseId, params.memberId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  await assertEnrolledStudentContentAccess({
    courseId: params.courseId,
    profileId: student.profileId,
    contentId: params.exerciseId,
    type: ContentType.Exercise
  });

  const submission = await createSubmissionService(
    params.courseId,
    params.exerciseId,
    student.memberId,
    payload.answers,
    { strict: true, allowUploads: false, source }
  );

  return toPublicSubmission(submission);
}
