import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Context } from 'hono';

import { ErrorCodes, type ErrorCode } from '@cio/utils/constants';

export { ErrorCodes, type ErrorCode };

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
