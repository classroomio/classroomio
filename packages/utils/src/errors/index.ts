import { ErrorCodes, type ErrorCode } from '../constants';

export { ErrorCodes, type ErrorCode };
export { getPostgresError, isUniqueConstraintViolation, type PostgresErrorDetails } from './postgres-error';

/**
 * Standard HTTP status code value. Kept as a structural `number` so this
 * module stays free of HTTP-framework deps (hono). The api layer narrows
 * this when handing the value to its response helpers.
 */
export type AppErrorStatusCode = number;

/**
 * Standard application error with code for easy identification.
 *
 * Lives in `@cio/utils/errors` so it can be thrown from any workspace package
 * (notably `@cio/core`) without those packages depending on `@cio/api`.
 * HTTP-shaped helpers like `handleError` stay in `@cio/api`.
 */
export class AppError extends Error {
  constructor(
    error: string | Error,
    public code: string,
    public statusCode: AppErrorStatusCode = 500,
    public field?: string
  ) {
    super(error instanceof Error ? error.message : error);
    this.name = 'AppError';
  }
}
