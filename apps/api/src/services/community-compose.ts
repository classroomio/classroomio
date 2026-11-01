import { AppError, ErrorCodes } from '@api/utils/errors';
import { createComment, createQuestion } from '@api/services/community';
import { getQuestionAuthorAndCourse } from '@cio/db/queries/community';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { generateSlug } from '@cio/utils/functions';
import { sanitizeHtml } from '@cio/core/utils/sanitize-html';
import type { TCommunityAnswerCreate, TCommunityQuestionCreate } from '@cio/utils/validation/community';

/**
 * Creates a question as the signed-in user in a course of the active organization.
 * The slug, author and organization are derived on the server.
 */
export async function askCommunityQuestion(orgId: string, profileId: string, fields: TCommunityQuestionCreate) {
  const courseOrgId = await getOrgIdByCourseId(fields.courseId);
  if (courseOrgId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const canAccessCourse = await isUserCourseMemberOrOrgAdmin(fields.courseId, profileId);
  if (!canAccessCourse) {
    throw new AppError(
      'You must be a member of this course to ask a question',
      ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      403
    );
  }

  const slug = generateSlug(fields.title, { appendTimestamp: true });
  const body = sanitizeHtml(fields.body);

  return createQuestion({
    title: fields.title,
    body,
    courseId: fields.courseId,
    organizationId: orgId,
    authorProfileId: profileId,
    votes: 0,
    slug
  });
}

/**
 * Adds an answer as the signed-in user to a question in the active organization.
 */
export async function answerCommunityQuestion(
  orgId: string,
  profileId: string,
  questionId: number,
  fields: TCommunityAnswerCreate
) {
  const question = await getQuestionAuthorAndCourse(questionId);
  if (!question || question.organizationId !== orgId) {
    throw new AppError('Question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
  }

  const canAccessCourse = await isUserCourseMemberOrOrgAdmin(question.courseId, profileId);
  if (!canAccessCourse) {
    throw new AppError('You must be a member of this course to answer', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }

  const body = sanitizeHtml(fields.body);

  return createComment({ body, questionId, authorProfileId: profileId, votes: 0 });
}
