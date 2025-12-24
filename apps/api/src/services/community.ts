import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TCommunityAnswer, TCommunityQuestion, TCourse } from '@db/types';
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
  upvoteQuestion
} from '@cio/db/queries/community';

import { getCoursesByOrgId } from './organization';

export async function fetchCommunityQuestions(orgId: string): Promise<Partial<TCommunityQuestion>[]> {
  let discussions: Partial<TCommunityQuestion>[] = [];

  let courses: TCourse[];

  if (orgId) {
    courses = await getCoursesByOrgId(orgId);
  } else {
    throw new AppError(
      'Organization not found for the given site name',
      ErrorCodes.COMMUNITY_QUESTIONS_FETCH_FAILED,
      404
    );
  }

  try {
    const courseIds = courses.map((course) => course.id);
    discussions = await getCommunityQuestions(courseIds);

    return discussions;
  } catch (error) {
    console.error('Failed to fetch community questions:', error);
    throw new AppError('Failed to fetch community questions', ErrorCodes.COMMUNITY_QUESTIONS_FETCH_FAILED, 500);
  }
}

export async function fetchCommunityQuestion({ slug }: Partial<TCommunityQuestion>) {
  try {
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
    const result = await editCommunityQuestion({ id, title, body, courseId: courseId });

    return result;
  } catch (error) {
    console.error('Failed to update community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update community question', ErrorCodes.UPDATE_COMMUNITY_QUESTION_FAILED, 500);
  }
}

export async function createComment({ body, questionId, authorProfileId, votes }: Partial<TCommunityAnswer>) {
  try {
    const result = await submitComment({ body, questionId, authorProfileId, votes });

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

export async function deleteQuestion({ id }: Partial<TCommunityQuestion>) {
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

export async function deleteComment({ id }: Partial<TCommunityAnswer>) {
  try {
    const result = await deleteCommentById(id);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}

export async function deleteCommentsByQuestionId({ questionId }: Partial<TCommunityAnswer>) {
  try {
    const result = await deleteCommentByQuestionId(questionId);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}
