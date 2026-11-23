import { notify } from '@cio/core/services/notification/notify';
import {
  LEARNER_INACTIVE_DAYS,
  listCoursesWithStudents,
  listLearnerProgress
} from '@cio/db/queries/teaching/learner-progress';
import {
  listCourseTutorProfileIds,
  listEndedSessionsWithoutAttendance,
  listSessionsStartingBetween
} from '@cio/db/queries/teaching/sessions';

import { log } from '../../utils/logger';
import { planLearnerAttentionNotifications, planSessionNotifications } from './staff-scan-plan';

const MINUTE_MS = 60_000;

const HOST_REMINDER_LEAD_MINUTES = 60;

const ATTENDANCE_REMINDER_LOOKBACK_HOURS = 24;

const LEARNER_SCAN_BATCH_SIZE = 100;

/**
 * Reminds hosts (or the course's tutors) of sessions starting within the hour, and asks them to take attendance for
 * sessions that ended in the last day without any. Notifications are keyed per session start, so overlapping scans
 * send each reminder once.
 */
export async function processStaffSessionScan(now: Date = new Date()) {
  const [startingSoon, missingAttendance] = await Promise.all([
    listSessionsStartingBetween(now, new Date(now.getTime() + HOST_REMINDER_LEAD_MINUTES * MINUTE_MS)),
    listEndedSessionsWithoutAttendance(
      now,
      new Date(now.getTime() - ATTENDANCE_REMINDER_LOOKBACK_HOURS * 60 * MINUTE_MS)
    )
  ]);

  const tutorsByCourse = await listCourseTutorProfileIds([
    ...startingSoon.map((session) => session.courseId),
    ...missingAttendance.map((session) => session.courseId)
  ]);

  const inputs = [
    ...planSessionNotifications('live_session_host_reminder', startingSoon, tutorsByCourse),
    ...planSessionNotifications('attendance_reminder', missingAttendance, tutorsByCourse)
  ];

  let notified = 0;
  for (const input of inputs) {
    const result = await notify(input);
    notified += result.notificationIds.length;
  }

  log.info('staff-session-scan-done', {
    startingSoon: startingSoon.length,
    missingAttendance: missingAttendance.length,
    notified
  });

  return { startingSoon: startingSoon.length, missingAttendance: missingAttendance.length, notified };
}

/**
 * Tells each course's tutors how many learners stalled since the previous scan: no activity for a week, or the same
 * exercise failed twice without a pass. Older stalls stay visible in the app's Needs a nudge filter.
 */
export async function processLearnerAttentionScan(now: Date = new Date()) {
  const courses = await listCoursesWithStudents();
  const organizationByCourse = new Map(courses.map((course) => [course.courseId, course.organizationId]));

  let flagged = 0;
  let notified = 0;

  for (let start = 0; start < courses.length; start += LEARNER_SCAN_BATCH_SIZE) {
    const courseIds = courses.slice(start, start + LEARNER_SCAN_BATCH_SIZE).map((course) => course.courseId);
    const [{ rows }, tutorsByCourse] = await Promise.all([
      listLearnerProgress({ courseIds, needsNudgeOnly: true, now }),
      listCourseTutorProfileIds(courseIds)
    ]);
    flagged += rows.length;

    const inputs = planLearnerAttentionNotifications({
      rows,
      organizationByCourse,
      tutorsByCourse,
      inactiveDays: LEARNER_INACTIVE_DAYS,
      now
    });

    for (const input of inputs) {
      const result = await notify(input);
      notified += result.notificationIds.length;
    }
  }

  log.info('learner-attention-scan-done', { courses: courses.length, flagged, notified });

  return { courses: courses.length, flagged, notified };
}
