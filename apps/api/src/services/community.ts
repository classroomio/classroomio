import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TCommunityAnswer, TCommunityQuestion, TNewCommunityQuestion } from '@db/types';
import {
  createCommunityQuestion,
  deleteCommentById,
  deleteCommentByQuestionId,
  deleteQuestionByQuestionId,
  editCommunityQuestion,
  getCommunityQuestion,
  getCommunityQuestions,
  submitComment,
  upvoteAnswer,
  upvoteQuestion,
  type CommunityQuestionQueryResult
} from '@cio/db/queries/community';
import { getEnrolledCourses, getOrgCourses } from '@cio/db/queries/course';

import { ROLE } from '@cio/utils/constants';

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

    let discussions: CommunityQuestionQueryResult[];

    switch (userRole) {
      case ROLE.ADMIN:
        // Admins can see all questions in the organization - no need to fetch courses
        discussions = await getCommunityQuestions({ orgId });
        break;
      case ROLE.TUTOR:
        // Tutors can see questions in courses they have access to
        const tutorCourses = await getOrgCourses({ orgId, profileId: userId });
        const tutorCourseIds = tutorCourses.map((course) => course.id);
        discussions = await getCommunityQuestions({ courseIds: tutorCourseIds });
        break;
      case ROLE.STUDENT:
        // Students can see questions in courses they are enrolled in
        const studentCourses = await getEnrolledCourses({ orgId, profileId: userId });
        const studentCourseIds = studentCourses.map((course) => course.id);
        discussions = await getCommunityQuestions({ courseIds: studentCourseIds });
        break;
      default:
        throw new AppError('Invalid role', ErrorCodes.UNAUTHORIZED, 403);
    }

    return discussions;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Failed to fetch community questions:', error);
    throw new AppError('Failed to fetch community questions', ErrorCodes.COMMUNITY_QUESTIONS_FETCH_FAILED, 500);
  }
}

export async function fetchCommunityQuestion({ slug }: Partial<TCommunityQuestion>) {
  try {
    if (!slug) {
      throw new AppError('Slug is required', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 400);
    }
    const result = await getCommunityQuestion(slug);

    if (!result) {
      throw new AppError('Community question not found', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 404);
    }

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
