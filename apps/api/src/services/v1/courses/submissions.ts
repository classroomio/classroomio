import { getCourseMember } from '@cio/db/queries/course/people';
import { getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import { getSubmissionById } from '@cio/db/queries/submission';
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
  listSubmissionsForGrading,
  resolveSubmissionGradingState,
  updateSubmissionGradesBatch,
  updateSubmissionService
} from '@api/services/submission';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin, paginateInMemory } from '../shared';
import { assertExerciseBelongsToCourse } from './exercises';

function toPublicSubmission(submission: TSubmission) {
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

  const { sections } = await listSubmissionsForGrading(params.courseId);
  const submissions = sections
    .flatMap((section) => section.items)
    .filter(
      (item) =>
        (!query.exerciseId || item.exercise.id === query.exerciseId) &&
        (!query.memberId || item.memberId === query.memberId) &&
        (!query.gradingState || item.gradingState === query.gradingState)
    )
    .sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime() || b.id.localeCompare(a.id)
    );

  const { items, pagination } = paginateInMemory(submissions, query);

  return {
    items: items.map((item) => ({
      id: item.id,
      exerciseId: item.exercise.id,
      exerciseTitle: item.exercise.title,
      memberId: item.memberId,
      student: item.student
        ? {
            profileId: item.student.id,
            fullname: item.student.fullname ?? null,
            email: item.student.email ?? null,
            avatarUrl: item.student.avatarUrl ?? null
          }
        : null,
      gradingState: item.gradingState,
      overallStatus: item.overallStatus,
      total: item.total,
      feedback: item.feedback,
      isEarly: item.isEarly,
      submittedAt: item.createdAt
    })),
    pagination
  };
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

  const updated = await updateSubmissionGradesBatch(params.submissionId, payload);

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

  const updated = await updateSubmissionService(params.submissionId, payload);

  return toPublicSubmission(updated);
}

export async function deleteCourseSubmissionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSubmissionParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertSubmissionBelongsToCourse(params.courseId, params.submissionId);

  const deleted = await deleteSubmissionService(params.submissionId);

  return toPublicSubmission(deleted);
}
