// Default time window for rate limiting (1 minute in milliseconds)
export const DEFAULT_WINDOW_MS = 60 * 1000;

export const DEFAULT_MAX_REQUESTS = 100;

export const RATE_LIMIT_KEY_PREFIX = 'rate_limit:';

export const DEFAULT_RATE_LIMITER_OPTIONS = {
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
} as const;

export const HTTP_STATUS = {
  TOO_MANY_REQUESTS: 429
} as const;

export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Too Many Requests',
  REDIS_PIPELINE_FAILED: 'Redis pipeline execution failed'
} as const;

export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After'
} as const;
