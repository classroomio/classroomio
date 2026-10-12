import { AppError, ErrorCodes } from '@api/utils/errors';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';
import { getActivityById } from '@cio/db/queries/activity/activity';

/**
 * Runs course-level side effects after an activity completion commits.
 * Certification first, then the compliance record. Throws when the activity
 * is missing so callers never certify against a deleted item.
 */
export async function runActivityCompletionSideEffects(
  activityId: string,
  profileId: string,
  timeSpentMinutes?: number
): Promise<void> {
  const activity = await getActivityById(activityId);

  if (!activity) {
    throw new AppError('Activity not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  await evaluateCourseCertification(activity.courseId, profileId);
  await syncComplianceProgressForMember(activity.courseId, profileId, 'activity', timeSpentMinutes);
}
