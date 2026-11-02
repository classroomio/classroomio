import { ApiError } from '@/feature/common/api/request';

/** True when a request failed before reaching the server, as opposed to the server answering with an error. */
export function isNetworkError(error: unknown) {
  if (error instanceof ApiError) return false;

  return (
    error instanceof TypeError || (error instanceof Error && /network|offline|internet|timed out/i.test(error.message))
  );
}
