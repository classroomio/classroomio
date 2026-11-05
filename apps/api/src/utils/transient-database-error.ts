const TRANSIENT_DATABASE_ERROR_CODES = new Set([
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  'CONNECTION_DESTROYED',
  'CONNECT_TIMEOUT',
  'ECONNABORTED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  '53200',
  '53300',
  '57P01',
  '57P02',
  '57P03'
]);

const CONNECTION_EXCEPTION_SQLSTATE_CLASS = '08';

/**
 * True for errors raised when Postgres or the pooler drops, restarts or refuses a
 * connection (postgres.js connection codes, Node socket codes, SQLSTATE class 08,
 * admin/crash shutdown and out-of-memory). Follows `cause` and `AggregateError`
 * chains so Drizzle's `DrizzleQueryError` wrapper is seen through.
 */
export function isTransientDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  if (TRANSIENT_DATABASE_ERROR_CODES.has(code) || code.startsWith(CONNECTION_EXCEPTION_SQLSTATE_CLASS)) {
    return true;
  }

  if ('cause' in error && isTransientDatabaseError(error.cause)) {
    return true;
  }

  if ('errors' in error && Array.isArray(error.errors)) {
    return error.errors.some((nested) => isTransientDatabaseError(nested));
  }

  return false;
}
