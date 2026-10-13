import { QUESTION_TYPE_ID_TO_KEY } from '@cio/question-types';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import { hasSubmission } from '@cio/db/queries/submission';
import { ContentType, ROLE } from '@cio/utils/constants';
import type {
  TPublicApiCourseLearnerExerciseParam,
  TPublicApiCourseLearnerLessonParam,
  TPublicApiCreateLearnerSubmission,
  TPublicApiSetLearnerLessonCompletion
} from '@cio/utils/validation/public-api';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { upsertLessonCompletionService } from '@api/services/lesson';
import { createSubmissionService } from '@api/services/submission';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';
import { assertExerciseBelongsToCourse } from './exercises';
import { toPublicSubmission } from './submissions';

const UPLOAD_QUESTION_TYPES = new Set(['FILE_UPLOAD', 'VIDEO_RECORDING']);

/**
 * The key's creator must be course team or org admin, as on the dashboard's grading routes. The learner must be a
 * student of this course with an account. Returns the learner both ways the internal services identify them.
 */
async function resolveLearner(orgId: string, actorId: string | null, courseId: string, memberId: string) {
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

export async function setLearnerLessonCompletionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLearnerLessonParam,
  payload: TPublicApiSetLearnerLessonCompletion
) {
  const learner = await resolveLearner(orgId, actorId, params.courseId, params.memberId);

  const lesson = await getLessonById(params.lessonId);
  if (!lesson || lesson.courseId !== params.courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  await assertEnrolledStudentContentAccess({
    courseId: params.courseId,
    profileId: learner.profileId,
    contentId: params.lessonId,
    type: ContentType.Lesson
  });

  const completion = await upsertLessonCompletionService(params.lessonId, learner.profileId, payload.isComplete);

  if (payload.isComplete) {
    void evaluateCourseCertification(params.courseId, learner.profileId).catch((certError) => {
      console.error('Failed to evaluate course certification after lesson completion:', certError);
    });
  }

  return {
    lessonId: params.lessonId,
    memberId: learner.memberId,
    isComplete: completion.isComplete ?? false,
    updatedAt: completion.updatedAt ?? null
  };
}

export async function createLearnerSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLearnerExerciseParam,
  payload: TPublicApiCreateLearnerSubmission
) {
  const learner = await resolveLearner(orgId, actorId, params.courseId, params.memberId);
  const exercise = await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  await assertEnrolledStudentContentAccess({
    courseId: params.courseId,
    profileId: learner.profileId,
    contentId: params.exerciseId,
    type: ContentType.Exercise
  });

  const questionTypeById = new Map(
    (await getQuestionsByExerciseIds([params.exerciseId])).map((question) => [
      Number(question.id),
      QUESTION_TYPE_ID_TO_KEY[Number(question.questionTypeId)]
    ])
  );

  for (const answer of payload.answers) {
    if (!questionTypeById.has(answer.questionId)) {
      throw new AppError(`Question ${answer.questionId} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
    }

    if (UPLOAD_QUESTION_TYPES.has(questionTypeById.get(answer.questionId) ?? '')) {
      throw new AppError(
        `Question ${answer.questionId} needs a file or video upload, which the API does not support`,
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }

  if (!exercise.allowMultipleAttempts && (await hasSubmission(params.exerciseId, learner.memberId))) {
    throw new AppError('This exercise allows only one submission', ErrorCodes.CONFLICT, 409);
  }

  const submission = await createSubmissionService(
    params.courseId,
    params.exerciseId,
    learner.memberId,
    payload.answers
  );

  return toPublicSubmission(submission);
}
