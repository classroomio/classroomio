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

  // Profile errors
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',

  // Account errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

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
  fallbackCode: string = ErrorCodes.INTERNAL_ERROR
) => {
  console.error('Error in route:', error);

  if (error instanceof AppError) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: error.message,
        code: error.code,
        field: error.field
      },
      error.statusCode
    );
  }

  return c.json<ErrorResponse>(
    {
      success: false,
      error: fallbackMessage,
      code: fallbackCode
    },
    500
  );
};
