import { ApiError } from '@/feature/common/api/request';
import type { en } from '@/feature/check-in/translations/en';

type CheckInErrorCopy = { title: keyof typeof en; description: keyof typeof en | null };

const COPY_BY_CODE: Record<string, CheckInErrorCopy> = {
  CHECK_IN_CODE_INVALID: { title: 'errorInvalidTitle', description: 'errorInvalid' },
  CHECK_IN_CODE_EXPIRED: { title: 'errorExpiredTitle', description: 'errorExpired' },
  CHECK_IN_NOT_ENROLLED: { title: 'errorNotEnrolledTitle', description: 'errorNotEnrolled' },
  LESSON_NOT_FOUND: { title: 'errorNotFoundTitle', description: 'errorNotFound' }
};

/** Catalog keys describing why a check-in failed; `description: null` means show the request's own message. */
export function checkInErrorCopy(error: unknown): CheckInErrorCopy {
  if (error instanceof ApiError) {
    if (error.code && COPY_BY_CODE[error.code]) return COPY_BY_CODE[error.code]!;
    if (error.status === 429) return { title: 'errorRateLimitedTitle', description: 'errorRateLimited' };
  }

  return { title: 'errorGenericTitle', description: null };
}
