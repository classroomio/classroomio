import {
  QUESTION_TYPE_ID_TO_KEY,
  fromApiPayload,
  validateTextareaAnswer,
  type ExerciseQuestionModel
} from '@cio/question-types';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import { hasSubmission } from '@cio/db/queries/submission';
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

const UPLOAD_QUESTION_TYPES = new Set(['FILE_UPLOAD', 'VIDEO_RECORDING']);

/**
 * The key's creator must be course team or org admin, as on the dashboard's grading routes. The student must be a
 * student of this course with an account. Returns the student both ways the internal services identify them.
 */
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

type StudentAnswer = TPublicApiCreateStudentSubmission['answers'][number];

function invalidAnswer(questionId: number, reason: string) {
  return new AppError(`Question ${questionId}: ${reason}`, ErrorCodes.VALIDATION_ERROR, 400);
}

/**
 * createSubmissionService saves the submission before it reads the answers, so a bad answer would leave an empty
 * submission behind and use up the student's attempt. Every answer is decoded here first, the same way.
 */
function assertAnswerIsValid(answer: StudentAnswer, question: ExerciseQuestionModel) {
  if (UPLOAD_QUESTION_TYPES.has(question.questionType)) {
    throw invalidAnswer(answer.questionId, 'needs a file or video upload, which the API does not support');
  }

  let answerData: ReturnType<typeof fromApiPayload>;
  try {
    answerData = fromApiPayload(question.questionType, answer, question);
  } catch {
    answerData = null;
  }

  if (!answerData) {
    throw invalidAnswer(answer.questionId, `the answer is not in the format a ${question.questionType} question takes`);
  }

  const optionIds = new Set((question.options ?? []).map((option) => Number(option.id)));
  const chosenOptionIds =
    answerData.type === 'RADIO' ? [answerData.optionId] : answerData.type === 'CHECKBOX' ? answerData.optionIds : [];
  if (chosenOptionIds.some((optionId) => !optionIds.has(Number(optionId)))) {
    throw invalidAnswer(answer.questionId, 'an option does not belong to this question');
  }

  if (answerData.type === 'NUMERIC' && !Number.isFinite(answerData.value)) {
    throw invalidAnswer(answer.questionId, 'the value must be a number');
  }

  if (answerData.type === 'TEXTAREA' && !validateTextareaAnswer(answerData.text, question).isValid) {
    throw invalidAnswer(answer.questionId, 'the answer is shorter or longer than the question allows');
  }
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

  const completion = await upsertLessonCompletionService(params.lessonId, student.profileId, payload.isComplete);

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
  payload: TPublicApiCreateStudentSubmission
) {
  const student = await resolveStudent(orgId, actorId, params.courseId, params.memberId);
  const exercise = await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  await assertEnrolledStudentContentAccess({
    courseId: params.courseId,
    profileId: student.profileId,
    contentId: params.exerciseId,
    type: ContentType.Exercise
  });

  const { questions } = await getExerciseWithRelationsOptimized(params.exerciseId);
  const questionById = new Map<number, ExerciseQuestionModel>(
    questions.map((question) => [
      Number(question.id),
      {
        id: Number(question.id),
        title: String(question.title ?? ''),
        questionType: QUESTION_TYPE_ID_TO_KEY[Number(question.questionTypeId)] ?? 'TEXTAREA',
        points: Number(question.points ?? 0),
        settings:
          question.settings && typeof question.settings === 'object' && !Array.isArray(question.settings)
            ? (question.settings as Record<string, unknown>)
            : {},
        options: (question.options ?? []).map((option) => ({
          id: option.id as number,
          label: option.label ?? '',
          value: option.value ?? undefined,
          isCorrect: option.isCorrect
        }))
      }
    ])
  );

  for (const answer of payload.answers) {
    const question = questionById.get(answer.questionId);
    if (!question) {
      throw new AppError(`Question ${answer.questionId} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
    }

    assertAnswerIsValid(answer, question);
  }

  if (!exercise.allowMultipleAttempts && (await hasSubmission(params.exerciseId, student.memberId))) {
    throw new AppError('This exercise allows only one submission', ErrorCodes.CONFLICT, 409);
  }

  const submission = await createSubmissionService(
    params.courseId,
    params.exerciseId,
    student.memberId,
    payload.answers
  );

  return toPublicSubmission(submission);
}
