import type { TCourse } from '@db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { CommunityQuestion } from '@api/types/community';
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

export async function fetchCommunityQuestions(orgId: string): Promise<CommunityQuestion[]> {
  let discussions: CommunityQuestion[] = [];

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

export async function fetchCommunityQuestion(slug: string) {
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
      createdAt: result.created_at,
      courseId: result.course_id,
      courseTitle: result.course.title,
      slug: result.slug,
      authorId: result.author.id,
      authorFullname: result.author.fullname,
      authorAvatarUrl: result.author.avatar_url,
      organizationId: result.course_id,
      comments: result.comments
    };
  } catch (error) {
    console.error('Failed to fetch community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch community question', ErrorCodes.COMMUNITY_QUESTION_NOT_FOUND, 500);
  }
}

export async function handleAddQuestion({ title, body, course_id, organization_id, author_profile_id, votes, slug }) {
  try {
    const result = await createCommunityQuestion({
      title,
      body,
      courseId: course_id,
      organizationId: organization_id,
      authorProfileId: author_profile_id,
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

export async function handleUpdateQuestion({
  id,
  title,
  body,
  course_id
}: {
  id: number;
  title: string;
  body: string;
  course_id: string;
}) {
  try {
    const result = await editCommunityQuestion({ id, title, body, courseId: course_id });

    return result;
  } catch (error) {
    console.error('Failed to update community question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update community question', ErrorCodes.UPDATE_COMMUNITY_QUESTION_FAILED, 500);
  }
}

export async function handleSubmitComment({
  body,
  questionId,
  authorId,
  votes
}: {
  body: string;
  questionId: number;
  authorId: string;
  votes: number;
}) {
  try {
    const result = await submitComment({ body, questionId, authorId, votes });

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

export async function handleUpvote({
  id,
  votes,
  isQuestion
}: {
  id: number | string;
  votes: number;
  isQuestion: boolean;
}) {
  try {
    let result;

    if (isQuestion) {
      result = await upvoteQuestion({ id: Number(id), votes });
    } else {
      result = await upvoteAnswer({ id: String(id), votes });
    }

    return result;
  } catch (error) {
    console.error('Failed to upvote:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to upvote', ErrorCodes.UPVOTE_FAILED, 500);
  }
}

export async function handleDeleteQuestion({ id }: { id: number }) {
  try {
    const result = await deleteQuestionByQuestionId(id);

    return result;
  } catch (error) {
    console.error('Failed to delete question:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete question', ErrorCodes.DELETE_QUESTION_FAILED, 500);
  }
}

export async function handleDeleteCommentById({ id }: { id: string }) {
  try {
    const result = await deleteCommentById(id);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}

export async function handleDeleteCommentByQuestionId({ questionId }: { questionId: number }) {
  try {
    const result = await deleteCommentByQuestionId(questionId);

    return result;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comment', ErrorCodes.DELETE_COMMENT_FAILED, 500);
  }
}
