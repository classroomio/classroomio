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
    throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);
  }

  let certError: unknown = null;
  try {
    await evaluateCourseCertification(activity.courseId, profileId);
  } catch (error) {
    certError = error;
    console.error('Failed to evaluate course certification after activity completion:', error);
  }

  let complianceError: unknown = null;
  try {
    let minutes = timeSpentMinutes;

    if (minutes !== undefined) {
      const sinceIso = await getComplianceCycleStartIso(activity.courseId, profileId);
      const activityIds = (await getActivitiesByCourseId(activity.courseId)).map((row) => row.id);
      const stats = await getScormActivityStatsForProfile(activityIds, profileId, db, sinceIso);

      minutes = Math.floor(stats.reduce((total, row) => total + (row.timeSpentSeconds ?? 0), 0) / 60);
    }

    await syncComplianceProgressForMember(activity.courseId, profileId, 'activity', minutes);
  } catch (error) {
    complianceError = error;
    console.error('Failed to sync compliance progress after activity completion:', error);
  }

  if (certError && complianceError) {
    throw certError;
  }
}

/**
 * Schedules an independent retry of completion side effects when an attempt
 * fails, decoupling recovery from learner-initiated requests.
 */
export function scheduleActivityCompletionSideEffectsRetry(
  activityId: string,
  profileId: string,
  timeSpentMinutes?: number,
  attempt = 1,
  maxAttempts = 3
): void {
  const delayMs = Math.min(1000 * Math.pow(3, attempt), 30000);
  const timer = setTimeout(async () => {
    try {
      await runActivityCompletionSideEffects(activityId, profileId, timeSpentMinutes);
    } catch (err) {
      console.error(`Completion side effects retry ${attempt}/${maxAttempts} failed:`, err);
      if (attempt < maxAttempts) {
        scheduleActivityCompletionSideEffectsRetry(activityId, profileId, timeSpentMinutes, attempt + 1, maxAttempts);
      }
    }
  }, delayMs);
  timer.unref?.();
}
