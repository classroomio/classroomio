import { getMediaJobById } from '@cio/db/queries/jobs';

import { log } from './logger';

/**
 * Lightweight cooperative cancellation. Workers check `isCancelRequested` at
 * step boundaries and inside long ffmpeg/fetch loops. The plan calls for
 * `cancelRequestedAt` on each run table, with the worker abandoning further
 * work the moment it observes a request.
 */

export class JobCanceledError extends Error {
  constructor(public readonly mediaJobId: string) {
    super(`Media job ${mediaJobId} canceled by user request`);
    this.name = 'JobCanceledError';
  }
}

export async function isMediaJobCancelRequested(mediaJobId: string): Promise<boolean> {
  try {
    const job = await getMediaJobById(mediaJobId);
    return Boolean(job?.cancelRequestedAt);
  } catch (error) {
    log.warn('cancel-check-failed', { mediaJobId, error: errorMessage(error) });
    return false;
  }
}

export async function throwIfCancelRequested(mediaJobId: string): Promise<void> {
  if (await isMediaJobCancelRequested(mediaJobId)) {
    throw new JobCanceledError(mediaJobId);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
