import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import { AppError, ErrorCodes, type ErrorCode, getPostgresError, isUniqueConstraintViolation } from '@cio/utils/errors';

// AppError moved to `@cio/utils/errors` so it can be thrown from
// non-api workspace packages (notably `@cio/core`). Re-exported
// here to keep the long-standing `@api/utils/errors` import path working
// for the rest of the api codebase.
export { AppError, ErrorCodes, type ErrorCode };

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  field?: string;
}

function getZodErrorField(error: ZodError): string | undefined {
  const firstIssue = error.issues[0];
  if (!firstIssue || firstIssue.path.length === 0) {
    return undefined;
  }

  return firstIssue.path.map(String).join('.');
}

export function formatZodErrorMessage(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const fieldPath = issue.path.length > 0 ? `${issue.path.map(String).join('.')}: ` : '';

      return `${fieldPath}${issue.message}`;
    })
    .join('; ');
}

/**
 * Maps residual membership unique violations to explicit conflict codes.
 * Enrolment writers dedupe up front, so these only fire on concurrent races —
 * defence in depth, never the primary path. Returns null when the error is not
 * a recognized membership conflict.
 */
export function membershipConflictError(error: unknown): AppError | null {
  const pg = getPostgresError(error);
  if (!pg || pg.code !== '23505') return null;

  if (pg.constraint === 'organizationmember_org_email_unique') {
    return new AppError(
      'This email is already linked to another account in this organization',
      ErrorCodes.ORG_MEMBER_EMAIL_LINKED_TO_OTHER_ACCOUNT,
      409,
      'email'
    );
  }

  if (pg.constraint === 'unique_group_email' || pg.constraint === 'unique_group_profile') {
    return new AppError('Already a member of this course', ErrorCodes.COURSE_MEMBER_EXISTS, 409);
  }

  return null;
}

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
      error.statusCode as ContentfulStatusCode
    );
  }

  if (isUniqueConstraintViolation(error)) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: 'Resource already exists',
        code: ErrorCodes.CONFLICT
      },
      409
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

/**
 * Handles errors for public API routes, surfacing Zod validation failures
 * as 400 responses instead of generic 500 INTERNAL_ERROR payloads.
 */
export const handlePublicApiError = (
  c: Context,
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred',
  fallbackCode?: string
) => {
  if (error instanceof ZodError) {
    console.error('Error in route:', error);

    return c.json<ErrorResponse>(
      {
        success: false,
        error: formatZodErrorMessage(error),
        code: ErrorCodes.VALIDATION_ERROR,
        field: getZodErrorField(error)
      },
      400
    );
  }

  return handleError(c, error, fallbackMessage, fallbackCode);
};
