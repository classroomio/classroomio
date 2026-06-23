import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueNotifyCourseSessionUpdate } from '@cio/jobs';

/**
 * Enqueue a background job that emails every course member an updated calendar
 * invite after a teacher changes a live session. Returns the job id.
 */
export async function notifyCourseSessionUpdateService(courseId: string, lessonId: string): Promise<{ jobId: string }> {
  const jobId = await enqueueNotifyCourseSessionUpdate({ courseId, lessonId });

  if (!jobId) {
    throw new AppError('Failed to enqueue session update notification', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return { jobId };
}
