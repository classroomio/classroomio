import { ErrorCodes } from '@cio/utils/constants';
import { tryParseApiErrorBody } from '$lib/utils/services/api/parse-api-error-body';

const COHORT_ERROR_CODE_SNACKBAR_KEYS: Record<string, string> = {
  [ErrorCodes.COHORT_FORBIDDEN]: 'snackbar.cohort.error.code.cohort_forbidden',
  [ErrorCodes.COHORT_MEMBER_CHECK_FAILED]: 'snackbar.cohort.error.code.cohort_member_check_failed',
  [ErrorCodes.COHORT_NOT_FOUND]: 'snackbar.cohort.error.code.cohort_not_found',
  [ErrorCodes.COHORT_CREATE_FAILED]: 'snackbar.cohort.error.code.cohort_create_failed',
  [ErrorCodes.COHORT_UPDATE_FAILED]: 'snackbar.cohort.error.code.cohort_update_failed',
  [ErrorCodes.COHORT_DELETE_FAILED]: 'snackbar.cohort.error.code.cohort_delete_failed',
  [ErrorCodes.COHORT_MEMBER_NOT_FOUND]: 'snackbar.cohort.error.code.cohort_member_not_found',
  [ErrorCodes.COHORT_NEWSFEED_NOT_FOUND]: 'snackbar.cohort.error.code.cohort_newsfeed_not_found',
  [ErrorCodes.COHORT_NEWSFEED_COMMENT_NOT_FOUND]: 'snackbar.cohort.error.code.cohort_newsfeed_comment_not_found'
};

export function getErrorKey(rawError: string | null, kind: 'create' | 'update'): string {
  const parsed = tryParseApiErrorBody(rawError);
  const mapped = parsed?.code ? COHORT_ERROR_CODE_SNACKBAR_KEYS[parsed.code] : undefined;

  if (mapped) {
    return mapped;
  }

  return kind === 'update' ? 'snackbar.cohort.error.post_update_failed' : 'snackbar.cohort.error.post_create_failed';
}
