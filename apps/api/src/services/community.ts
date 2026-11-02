import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TCommunityAnswer, TCommunityQuestion, TNewCommunityQuestion } from '@db/types';
import {
  createCommunityQuestion,
  deleteCommentById,
  deleteCommentByQuestionId,
  deleteQuestionByQuestionId,
  editCommunityQuestion,
  getCommunityQuestion,
  getCommunityQuestionMetaBySlug,
  getCommunityQuestions,
  submitComment,
  upsertCommunityQuestionSubscription,
  upvoteAnswer,
  upvoteQuestion,
  type CommunityQuestionQueryResult
} from '@cio/db/queries/community/community';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group/group';
import { getEnrolledCourses, getOrgCourses } from '@cio/db/queries/course/course';

import { ROLE } from '@cio/utils/constants';
import { notifyCommunityAnswer } from '@cio/core/services/notification/course-events';

export function isCommunityStaffRole(userRole: number) {
  return userRole === ROLE.ADMIN || userRole === ROLE.TUTOR;
}

/** The questions a member may see in the organization: every course for admins, taught courses for tutors, and enrolled courses for students. */
export async function getCommunityScope(
  orgId: string,
  userId: string,
  userRole: number
): Promise<{ orgId: string } | { courseIds: string[] }> {
  switch (userRole) {
    case ROLE.ADMIN:
      return { orgId };
    case ROLE.TUTOR: {
      const tutorCourses = await getOrgCourses({ orgId, profileId: userId });

      return { courseIds: tutorCourses.items.map((course) => course.id) };
    }
    case ROLE.STUDENT: {
      const studentCourses = await getEnrolledCourses({ orgId, profileId: userId });

      return { courseIds: studentCourses.map((course) => course.id) };
    }
    default:
      throw new AppError('Invalid role', ErrorCodes.UNAUTHORIZED, 403);
  }
}

export async function fetchCommunityQuestions(
  orgId: string,
  userId: string,
  userRole: number
): Promise<CommunityQuestionQueryResult[]> {
  try {
    if (!orgId) {
      throw new AppError(
        'Organization not found for the given site name',
        ErrorCodes.COMMUNITY_QUESTIONS_FETCH_FAILED,
        404
      );
    }

    if (userRole === null) {
      throw new AppError('User is not a member of this organization', ErrorCodes.UNAUTHORIZED, 403);
    }

    const scope = await getCommunityScope(orgId, userId, userRole);
    const viewer = { profileId: userId, includeHidden: isCommunityStaffRole(userRole) };

    return await getCommunityQuestions(scope, viewer);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Failed to fetch community questions:', error);
    throw new AppError('Failed to fetch community questions', ErrorCodes.COMMUNITY_QUESTIONS_FETCH_FAILED, 500);
  }
}

/**
 * One question with its answers. Hidden questions and answers are returned only to the course team and org admins.
 * Opening a question marks it read for the viewer.
 */
export async function fetchCommunityQuestion(orgId: string, profileId: string, slug: string) {
  try {
    const meta = await getCommunityQuestionMetaBySlug(slug);
    if (!meta || meta.organizationId !== orgId) {
      throw new AppError('Community question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
    }

    const includeHidden = await isCourseTeamMemberOrOrgAdmin(meta.courseId, profileId);
    const result = await getCommunityQuestion(slug, { profileId, includeHidden });

    if (!result) {
      throw new AppError('Community question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
    }

    await upsertCommunityQuestionSubscription({ questionId: result.id, profileId, markRead: true });

    return {
      id: result.id,
      title: result.title,
      body: result.body,
      votes: result.votes,
      createdAt: result.createdAt,
      courseId: result.courseId,
      courseTitle: result.course.title,
      slug: result.slug,
      authorId: result.author.id,
      authorFullname: result.author.fullname,
      authorAvatarUrl: result.author.avatarUrl,
      organizationId: result.organizationId,
      isHidden: result.isHidden,
      acceptedAnswerId: result.acceptedAnswerId,
      isFollowing: result.isFollowing,
      canModerate: includeHidden,
      comments: result.comments
    };
  } catch (error) {
    console.error('Failed to fetch community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch community question', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 500);
  }
}

export async function createQuestion({
  title,
  body,
  courseId,
  organizationId,
  authorProfileId,
  votes,
  slug
}: Partial<TCommunityQuestion>) {
  try {
    if (!courseId || !organizationId || !authorProfileId) {
      throw new AppError('Missing required fields', ErrorCodes.ADD_COMMUNITY_QUESTION_FAILED, 400);
    }
    const result = await createCommunityQuestion({
      title,
      body,
      courseId,
      organizationId,
      authorProfileId,
      votes,
      slug
    });

    if (!result) {
      throw new AppError('Failed to create community question', ErrorCodes.ADD_COMMUNITY_QUESTION_FAILED, 404);
    }

    await upsertCommunityQuestionSubscription({
      questionId: result.id,
      profileId: authorProfileId,
      isFollowing: true,
      markRead: true
    });

    return {
      id: result.id,
      title: result.title,
      body: result.body,
      votes: result.votes,
      createdAt: result.createdAt,
      courseId: result.courseId,
      courseTitle: result.title,
      slug: result.slug,
      authorId: result.authorId
    };
  } catch (error) {
    console.error('Failed to add community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add community question', ErrorCodes.ADD_COMMUNITY_QUESTION_FAILED, 500);
  }
}

export async function editQuestion({ id, title, body, courseId }: Partial<TCommunityQuestion>) {
  try {
    if (!id || !courseId) {
      throw new AppError('Question ID and Course ID are required', ErrorCodes.UPDATE_COMMUNITY_QUESTION_FAILED, 400);
    }
    const result = await editCommunityQuestion({ id, title, body, courseId });

    return result;
  } catch (error) {
    console.error('Failed to update community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update community question', ErrorCodes.UPDATE_COMMUNITY_QUESTION_FAILED, 500);
  }
}

export async function createComment({ body, questionId, authorProfileId, votes }: Partial<TCommunityAnswer>) {
  try {
    if (!body || !questionId || !authorProfileId) {
      throw new AppError('Missing required fields', ErrorCodes.COMMENT_SUBMISSION_FAILED, 400);
    }
    const result = await submitComment({ body, questionId, authorProfileId, votes: votes ?? 0 });

    if (!result) {
      throw new AppError('Comment submission failed', ErrorCodes.COMMENT_SUBMISSION_FAILED, 404);
    }

    await upsertCommunityQuestionSubscription({
      questionId: Number(questionId),
      profileId: authorProfileId,
      isFollowing: true,
      markRead: true
    });

    void notifyCommunityAnswer({ questionId: Number(questionId), answerId: result.id, authorProfileId });

    return {
      id: result.id,
      body: result.body,
      votes: result.votes,
      createdAt: result.createdAt,
      authorId: result.authorProfileId
    };
  } catch (error) {
    console.error('Failed to submit comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to submit comment', ErrorCodes.COMMENT_SUBMISSION_FAILED, 500);
  }
}

export async function upvote({ id, isQuestion }: { id: string | number; isQuestion: boolean }) {
  try {
    let result;

    if (isQuestion) {
      result = await upvoteQuestion({ id: Number(id) });
    } else {
      result = await upvoteAnswer({ id: String(id) });
    }

    return result;
  } catch (error) {
    console.error('Failed to upvote:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to upvote', ErrorCodes.UPVOTE_FAILED, 500);
  }
}

export async function deleteQuestion({ id }: { id: number }) {
  try {
    // Delete all comments first, then delete the question
    await deleteCommentByQuestionId(id);
    const result = await deleteQuestionByQuestionId(id);

    return result;
  } catch (error) {
    console.error('Failed to delete question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete question', ErrorCodes.DELETE_QUESTION_FAILED, 500);
  }
}

export async function deleteComment({ id }: { id: string }) {
  try {
    const result = await deleteCommentById(id);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}

export async function deleteCommentsByQuestionId({ questionId }: { questionId: number }) {
  try {
    const result = await deleteCommentByQuestionId(questionId);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}
