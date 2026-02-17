import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Context } from 'hono';

/**
 * Standard application error with code for easy identification
 */
export class AppError extends Error {
  constructor(
    error: string | Error,
    public code: string,
    public statusCode: ContentfulStatusCode = 500,
    public field?: string
  ) {
    super(error instanceof Error ? error.message : error);
    this.name = 'AppError';
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  field?: string;
}

// Error codes constants for consistency
export const ErrorCodes = {
  // Common errors
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Dashboard Analytics errors
  ORG_ANALYTICS_FETCH_FAILED: 'ORG_ANALYTICS_FETCH_FAILED',
  NO_ORG_ID_PROVIDED: 'NO_ORG_ID_PROVIDED',

  // Community errors
  UPDATE_COMMUNITY_QUESTION_FAILED: 'UPDATE_COMMUNITY_QUESTION_FAILED',
  ADD_COMMUNITY_QUESTION_FAILED: 'ADD_COMMUNITY_QUESTION_FAILED',
  COMMUNITY_QUESTIONS_FETCH_FAILED: 'COMMUNITY_QUESTIONS_FETCH_FAILED',
  COMMUNITY_QUESTION_NOT_FOUND: 'COMMUNITY_QUESTION_NOT_FOUND',
  COMMENT_SUBMISSION_FAILED: 'COMMENT_SUBMISSION_FAILED',
  UPVOTE_FAILED: 'UPVOTE_FAILED',
  DELETE_COMMENT_FAILED: 'DELETE_COMMENT_FAILED',
  DELETE_QUESTION_FAILED: 'DELETE_QUESTION_FAILED',

  // Organization errors
  SITENAME_EXISTS: 'SITENAME_EXISTS',
  ORG_CREATE_FAILED: 'ORG_CREATE_FAILED',
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORG_TEAM_FETCH_FAILED: 'ORG_TEAM_FETCH_FAILED',
  ORG_AUDIENCE_FETCH_FAILED: 'ORG_AUDIENCE_FETCH_FAILED',
  COURSES_FETCH_FAILED: 'COURSES_FETCH_FAILED',
  ORG_PLAN_CREATE_FAILED: 'ORG_PLAN_CREATE_FAILED',
  ORG_PLAN_UPDATE_FAILED: 'ORG_PLAN_UPDATE_FAILED',
  ORG_PLAN_CANCEL_FAILED: 'ORG_PLAN_CANCEL_FAILED',
  ORG_PLAN_NOT_FOUND: 'ORG_PLAN_NOT_FOUND',
  ORG_TEAM_INVITE_FAILED: 'ORG_TEAM_INVITE_FAILED',
  ORG_TEAM_REMOVE_FAILED: 'ORG_TEAM_REMOVE_FAILED',
  ORG_TEAM_EMAIL_EXISTS: 'ORG_TEAM_EMAIL_EXISTS',
  ORG_TEAM_NOT_AUTHORIZED: 'ORG_TEAM_NOT_AUTHORIZED',
  TAG_GROUP_NOT_FOUND: 'TAG_GROUP_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  TAG_FETCH_FAILED: 'TAG_FETCH_FAILED',
  TAG_CREATE_FAILED: 'TAG_CREATE_FAILED',
  TAG_UPDATE_FAILED: 'TAG_UPDATE_FAILED',
  TAG_ASSIGNMENT_FAILED: 'TAG_ASSIGNMENT_FAILED',

  // Asset errors
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_IN_USE: 'ASSET_IN_USE',
  ASSET_USAGE_NOT_FOUND: 'ASSET_USAGE_NOT_FOUND',
  ASSET_CREATE_FAILED: 'ASSET_CREATE_FAILED',
  ASSET_FETCH_FAILED: 'ASSET_FETCH_FAILED',
  ASSET_LIST_FAILED: 'ASSET_LIST_FAILED',
  ASSET_UPDATE_FAILED: 'ASSET_UPDATE_FAILED',
  ASSET_DELETE_FAILED: 'ASSET_DELETE_FAILED',
  ASSET_ATTACH_FAILED: 'ASSET_ATTACH_FAILED',
  ASSET_DETACH_FAILED: 'ASSET_DETACH_FAILED',
  ASSET_USAGE_FETCH_FAILED: 'ASSET_USAGE_FETCH_FAILED',
  ASSET_EXPORT_FAILED: 'ASSET_EXPORT_FAILED',
  ASSET_STORAGE_FETCH_FAILED: 'ASSET_STORAGE_FETCH_FAILED',

  // Profile errors
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',

  // Account errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',

  // Auth errors
  FORBIDDEN: 'FORBIDDEN',

  // Course errors
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  COURSE_FETCH_FAILED: 'COURSE_FETCH_FAILED',

  // Lesson errors
  LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',
  LESSON_FETCH_FAILED: 'LESSON_FETCH_FAILED',
  COURSE_SECTION_NOT_FOUND: 'COURSE_SECTION_NOT_FOUND',

  // Exercise errors
  EXERCISE_NOT_FOUND: 'EXERCISE_NOT_FOUND',
  EXERCISE_FETCH_FAILED: 'EXERCISE_FETCH_FAILED',

  // Submission errors
  SUBMISSION_NOT_FOUND: 'SUBMISSION_NOT_FOUND',
  SUBMISSION_FETCH_FAILED: 'SUBMISSION_FETCH_FAILED',

  // Comment errors
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  LESSON_COMMENT_UPDATE_FAILED: 'LESSON_COMMENT_UPDATE_FAILED',
  NEWSFEED_COMMENT_UPDATE_FAILED: 'NEWSFEED_COMMENT_UPDATE_FAILED',

  // Quiz errors
  QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',
  QUIZ_FETCH_FAILED: 'QUIZ_FETCH_FAILED',
  QUIZ_CREATE_FAILED: 'QUIZ_CREATE_FAILED',
  QUIZ_UPDATE_FAILED: 'QUIZ_UPDATE_FAILED',
  QUIZ_DELETE_FAILED: 'QUIZ_DELETE_FAILED',

  // Lesson Language errors
  LESSON_LANGUAGE_NOT_FOUND: 'LESSON_LANGUAGE_NOT_FOUND',
  LESSON_LANGUAGE_FETCH_FAILED: 'LESSON_LANGUAGE_FETCH_FAILED',
  LESSON_LANGUAGE_CREATE_FAILED: 'LESSON_LANGUAGE_CREATE_FAILED',
  LESSON_LANGUAGE_UPDATE_FAILED: 'LESSON_LANGUAGE_UPDATE_FAILED',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Handles errors consistently across all routes
 * @param c - Hono context
 * @param error - The error to handle
 * @param fallbackMessage - Default error message if error is not an AppError
 * @param fallbackCode - Default error code if error is not an AppError
 * @returns JSON error response with appropriate status code
 *
 * @example
 * ```typescript
 * try {
 *   const data = await someService();
 *   return c.json({ success: true, data });
 * } catch (error) {
 *   return handleError(c, error, 'Failed to process request');
 * }
 * ```
 */
export const handleError = (
  c: Context,
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred',
  fallbackCode?: string
) => {
  console.error('Error in route:', error);

  if (error instanceof AppError) {
    const isServerError = error.statusCode >= 500;
    const responseCode = isServerError ? (fallbackCode ?? error.code) : error.code;
    const responseMessage = isServerError ? fallbackMessage : error.message;

    return c.json<ErrorResponse>(
      {
        success: false,
        error: responseMessage,
        code: responseCode,
        field: isServerError ? undefined : error.field
      },
      error.statusCode
    );
  }

  return c.json<ErrorResponse>(
    {
      success: false,
      error: fallbackMessage,
      code: fallbackCode ?? ErrorCodes.INTERNAL_ERROR
    },
    500
  );
};
