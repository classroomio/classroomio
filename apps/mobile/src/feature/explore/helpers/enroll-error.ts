import { ApiError } from '@/feature/common/api/request';
import { errorMessage } from '@/feature/common/helpers/error-message';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { en } from '@/feature/explore/translations/en';

/** Learner-facing copy for a refused enrolment; the API's own messages are written for organization admins. */
export function enrollErrorMessage(error: unknown, t: Translator<typeof en>) {
  if (error instanceof ApiError) {
    if (error.code === 'UPGRADE_REQUIRED') return t('enrollFull');
    if (error.code === 'FORBIDDEN') return t('enrollMembersOnly');
    if (error.code === 'VALIDATION_ERROR') return t('enrollUnavailable');
  }

  return errorMessage(error);
}
