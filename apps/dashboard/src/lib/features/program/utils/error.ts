import { ErrorCodes } from '@cio/utils/constants';
import { tryParseApiErrorBody } from '$lib/utils/services/api/parse-api-error-body';

const PROGRAM_ERROR_CODE_SNACKBAR_KEYS: Record<string, string> = {
  [ErrorCodes.PROGRAM_FORBIDDEN]: 'snackbar.program.error.code.program_forbidden',
  [ErrorCodes.PROGRAM_MEMBER_CHECK_FAILED]: 'snackbar.program.error.code.program_member_check_failed',
  [ErrorCodes.PROGRAM_NOT_FOUND]: 'snackbar.program.error.code.program_not_found',
  [ErrorCodes.PROGRAM_CREATE_FAILED]: 'snackbar.program.error.code.program_create_failed',
  [ErrorCodes.PROGRAM_UPDATE_FAILED]: 'snackbar.program.error.code.program_update_failed',
  [ErrorCodes.PROGRAM_DELETE_FAILED]: 'snackbar.program.error.code.program_delete_failed',
  [ErrorCodes.PROGRAM_MEMBER_NOT_FOUND]: 'snackbar.program.error.code.program_member_not_found',
  [ErrorCodes.PROGRAM_NEWSFEED_NOT_FOUND]: 'snackbar.program.error.code.program_newsfeed_not_found',
  [ErrorCodes.PROGRAM_NEWSFEED_COMMENT_NOT_FOUND]: 'snackbar.program.error.code.program_newsfeed_comment_not_found'
};

export function getErrorKey(rawError: string | null, kind: 'create' | 'update'): string {
  const parsed = tryParseApiErrorBody(rawError);
  const mapped = parsed?.code ? PROGRAM_ERROR_CODE_SNACKBAR_KEYS[parsed.code] : undefined;

  if (mapped) {
    return mapped;
  }

  return kind === 'update' ? 'snackbar.program.error.post_update_failed' : 'snackbar.program.error.post_create_failed';
}
