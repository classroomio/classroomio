import { OperationalQueryError } from '@cio/db/queries/query-errors';

import { AppError, type ErrorCode } from '@api/utils/errors';

/**
 * Keeps AppErrors, maps query-layer rule failures to their own status, and wraps anything else as a 500.
 */
export function toAnalyticsError(error: unknown, fallbackCode: ErrorCode): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof OperationalQueryError) {
    return new AppError(error.message, error.errorCode, error.statusCode, error.field);
  }

  return new AppError(error instanceof Error ? error : 'Analytics request failed', fallbackCode, 500);
}
