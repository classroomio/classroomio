import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getCommentAuthorAndCourse,
  getCommunityQuestionsForYou,
  getQuestionAuthorAndCourse,
  setCommunityAcceptedAnswer,
  setCommunityAnswerHidden,
  setCommunityQuestionHidden,
  upsertCommunityQuestionSubscription
} from '@cio/db/queries/community/community';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group/group';

import { getCommunityScope, isCommunityStaffRole } from './community';

async function getOrgQuestionOrThrow(orgId: string, questionId: number) {
  const question = await getQuestionAuthorAndCourse(questionId);
  if (!question || question.organizationId !== orgId) {
    throw new AppError('Question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
  }

  return question;
}

async function assertCourseStaff(courseId: string, profileId: string) {
  const isStaff = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);
  if (!isStaff) {
    throw new AppError('Only course tutors and admins can moderate', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }
}

/** Questions the member asked, answered or follows in the organization, most recent activity first. */
export async function fetchCommunityForYou(orgId: string, profileId: string, userRole: number) {
  const scope = await getCommunityScope(orgId, profileId, userRole);
  const viewer = { profileId, includeHidden: isCommunityStaffRole(userRole) };

  return getCommunityQuestionsForYou(scope, viewer);
}

/** Follows or unfollows a question the member can see. Followers are notified of new answers. */
export async function setCommunityQuestionFollow(
  orgId: string,
  profileId: string,
  questionId: number,
  isFollowing: boolean
) {
  const question = await getOrgQuestionOrThrow(orgId, questionId);

  const canAccessCourse = await isUserCourseMemberOrOrgAdmin(question.courseId, profileId);
  if (!canAccessCourse) {
    throw new AppError('Question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
  }

  if (question.isHidden && !(await isCourseTeamMemberOrOrgAdmin(question.courseId, profileId))) {
    throw new AppError('Question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
  }

  await upsertCommunityQuestionSubscription({ questionId, profileId, isFollowing });

  return { questionId, isFollowing };
}

export async function setCommunityQuestionVisibility(
  orgId: string,
  profileId: string,
  questionId: number,
  isHidden: boolean
) {
  const question = await getOrgQuestionOrThrow(orgId, questionId);
  await assertCourseStaff(question.courseId, profileId);

  await setCommunityQuestionHidden(questionId, isHidden);

  return { questionId, isHidden };
}

export async function setCommunityAnswerVisibility(
  orgId: string,
  profileId: string,
  answerId: string,
  isHidden: boolean
) {
  const answer = await getCommentAuthorAndCourse(answerId);
  if (!answer || answer.organizationId !== orgId) {
    throw new AppError('Answer not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
  }

  await assertCourseStaff(answer.courseId, profileId);

  await setCommunityAnswerHidden(answerId, isHidden);

  return { answerId, questionId: answer.questionId, isHidden };
}

/**
 * Marks one visible answer of the question as accepted, or clears it with `answerId: null`. Allowed for the
 * question's author and the course team.
 */
export async function setCommunityAcceptedAnswerService(
  orgId: string,
  profileId: string,
  questionId: number,
  answerId: string | null
) {
  const question = await getOrgQuestionOrThrow(orgId, questionId);

  const isAuthor = question.authorId === profileId;
  if (!isAuthor) {
    await assertCourseStaff(question.courseId, profileId);
  }

  if (answerId) {
    const answer = await getCommentAuthorAndCourse(answerId);
    if (!answer || answer.questionId !== questionId || answer.isHidden) {
      throw new AppError('Answer not found on this question', ErrorCodes.VALIDATION_ERROR, 400);
    }
  }

  await setCommunityAcceptedAnswer(questionId, answerId);

  return { questionId, acceptedAnswerId: answerId };
}
