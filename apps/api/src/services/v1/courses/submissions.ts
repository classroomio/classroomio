import { getCourseMember } from '@cio/db/queries/course/people';
import { getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import {
  getCourseSubmissionsPage,
  getQuestionAnswersBySubmissionId,
  getSubmissionById
} from '@cio/db/queries/submission';
import type { TSubmission } from '@cio/db/types';
import type {
  TPublicApiCourseParam,
  TPublicApiCourseSubmissionParam,
  TPublicApiCourseSubmissionsQuery,
  TPublicApiGradeCourseSubmission,
  TPublicApiUpdateCourseSubmission
} from '@cio/utils/validation/public-api';
import {
  deleteSubmissionService,
  getSubmission,
  resolveSubmissionGradingState,
  resolveSubmissionOverallStatus,
  updateSubmissionGradesBatch,
  updateSubmissionService
} from '@api/services/submission';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin, toPublicApiPagination } from '../shared';
import { assertExerciseBelongsToCourse } from './exercises';

export function toPublicSubmission(submission: TSubmission) {
  return {
    id: submission.id,
    courseId: submission.courseId,
    exerciseId: submission.exerciseId,
    memberId: submission.submittedBy,
    gradingState: resolveSubmissionGradingState(submission),
    overallStatus: submission.overallStatus ?? null,
    total: submission.total ?? null,
    feedback: submission.feedback,
    submittedAt: submission.createdAt,
    updatedAt: submission.updatedAt
  };
}

async function assertCourseTeamAccess(orgId: string, actorId: string | null, courseId: string) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);
}

async function assertSubmissionBelongsToCourse(courseId: string, submissionId: string): Promise<TSubmission> {
  const submission = await getSubmissionById(submissionId);
  if (!submission || submission.courseId !== courseId) {
    throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
  }

  return submission;
}

export async function listCourseSubmissionsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseSubmissionsQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  if (query.exerciseId) {
    await assertExerciseBelongsToCourse(params.courseId, query.exerciseId);
  }
  if (query.memberId && !(await getCourseMember(params.courseId, query.memberId))) {
    throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
  }

  const { items, total } = await getCourseSubmissionsPage(
    params.courseId,
    { exerciseId: query.exerciseId, memberId: query.memberId, gradingState: query.gradingState },
    query
  );
  const questionTypeIdsByExerciseId = await getQuestionTypeIdsByExerciseId(
    items.map((item) => item.submission.exerciseId)
  );

  return {
    items: items.map(({ submission, exerciseTitle, exerciseDueBy, student }) => ({
      id: submission.id,
      exerciseId: submission.exerciseId,
      exerciseTitle,
      memberId: submission.submittedBy ?? null,
      student: student?.id
        ? {
            profileId: student.id,
            fullname: student.fullname ?? null,
            email: student.email ?? null,
            avatarUrl: student.avatarUrl ?? null
          }
        : null,
      gradingState: resolveSubmissionGradingState(submission),
      overallStatus: resolveSubmissionOverallStatus(
        submission.overallStatus,
        questionTypeIdsByExerciseId.get(submission.exerciseId) ?? []
      ),
      total: submission.total ?? null,
      feedback: submission.feedback,
      isEarly: isSubmittedEarly(submission.createdAt, exerciseDueBy),
      submittedAt: submission.createdAt ?? null
    })),
    pagination: toPublicApiPagination(query.page, query.limit, total)
  };
}

/** Returns true without a due date, and null when there is no submission time to compare. */
function isSubmittedEarly(submittedAt: string | null, dueBy: string | null): boolean | null {
  if (!dueBy) return true;
  if (!submittedAt) return null;

  return new Date(submittedAt).getTime() <= new Date(dueBy).getTime();
}

async function getQuestionTypeIdsByExerciseId(exerciseIds: string[]) {
  const questionTypeIdsByExerciseId = new Map<string, number[]>();
  for (const question of await getQuestionsByExerciseIds([...new Set(exerciseIds)])) {
    if (!question.exerciseId || question.questionTypeId == null) continue;

    const questionTypeIds = questionTypeIdsByExerciseId.get(question.exerciseId) ?? [];
    questionTypeIds.push(Number(question.questionTypeId));
    questionTypeIdsByExerciseId.set(question.exerciseId, questionTypeIds);
  }

  return questionTypeIdsByExerciseId;
}

export async function getCourseSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSubmissionParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertSubmissionBelongsToCourse(params.courseId, params.submissionId);

  const submission = await getSubmission(params.submissionId);

  return {
    ...toPublicSubmission(submission),
    answers: (submission.answers ?? []).map((answer) => ({
      questionId: answer.questionId,
      points: answer.point ?? null,
      answerData: answer.answerData ?? null
    }))
  };
}

/** Throws 400 if a graded question is not in the exercise or has no answer. */
export async function gradeCourseSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSubmissionParam,
  payload: TPublicApiGradeCourseSubmission
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const submission = await assertSubmissionBelongsToCourse(params.courseId, params.submissionId);

  const questionIds = new Set(
    (await getQuestionsByExerciseIds([submission.exerciseId])).map((question) => Number(question.id))
  );
  const unknownAnswer = payload.answers.find((answer) => !questionIds.has(answer.questionId));
  if (unknownAnswer) {
    throw new AppError(`Question ${unknownAnswer.questionId} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
  }

  const answeredQuestionIds = new Set(
    (await getQuestionAnswersBySubmissionId(params.submissionId)).map((answer) => Number(answer.questionId))
  );
  const unanswered = payload.answers.find((answer) => !answeredQuestionIds.has(answer.questionId));
  if (unanswered) {
    throw new AppError(
      `Question ${unanswered.questionId} has no answer on this submission, so it cannot be graded`,
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  const updated = await updateSubmissionGradesBatch(params.submissionId, params.courseId, payload, {
    actorProfileId: actorId
  });

  return toPublicSubmission(updated);
}

export async function updateCourseSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSubmissionParam,
  payload: TPublicApiUpdateCourseSubmission
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertSubmissionBelongsToCourse(params.courseId, params.submissionId);

  const updated = await updateSubmissionService(params.submissionId, params.courseId, payload, {
    actorProfileId: actorId
  });

  return toPublicSubmission(updated);
}

export async function deleteCourseSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSubmissionParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertSubmissionBelongsToCourse(params.courseId, params.submissionId);

  const deleted = await deleteSubmissionService(params.submissionId, params.courseId);

  return toPublicSubmission(deleted);
}
