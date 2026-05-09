/**
 * Thrown from query modules when a domain rule fails and the API layer should
 * map this to an AppError with the same code and status.
 */
export class OperationalQueryError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly statusCode: number,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'OperationalQueryError';
  }
}
