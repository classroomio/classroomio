import { AppError, ErrorCodes } from '@api/utils/errors';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';
import { getActivitiesByCourseId, getActivityById } from '@cio/db/queries/activity/activity';
import { getComplianceCycleStartIso } from '@cio/db/queries/course/compliance';
import { getScormActivityStatsForProfile } from '@cio/db/queries/scorm/report';
import { db } from '@cio/db/drizzle';

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

  let minutes = timeSpentMinutes;

  if (minutes !== undefined) {
    const sinceIso = await getComplianceCycleStartIso(activity.courseId, profileId);
    const activityIds = (await getActivitiesByCourseId(activity.courseId)).map((row) => row.id);
    const stats = await getScormActivityStatsForProfile(activityIds, profileId, db, sinceIso);

    minutes = Math.floor(stats.reduce((total, row) => total + (row.timeSpentSeconds ?? 0), 0) / 60);
  }

  await syncComplianceProgressForMember(activity.courseId, profileId, 'activity', minutes);
}
