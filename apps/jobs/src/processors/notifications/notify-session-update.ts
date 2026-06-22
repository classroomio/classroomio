import { getCourseById, getCourseWithOrgData } from '@cio/db/queries/course';
import { getCourseMembers } from '@cio/db/queries/course/people';
import { getLessonById } from '@cio/db/queries/lesson';
import { ROLE } from '@cio/utils/constants';
import { buildEmailBranding, buildEmailFromName, buildSessionIcs } from '@cio/email';
import { ZNotifyCourseSessionUpdatePayload, enqueueEmailSend } from '@cio/jobs';

import { log } from '../../utils/logger';

interface UpdateResult {
  notified: number;
}

function formatSessionTime(lessonAt: string, timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short'
    }).format(new Date(lessonAt));
  } catch {
    return new Date(lessonAt).toUTCString();
  }
}

/**
 * Emails every course member an UPDATED calendar invite after a teacher changes
 * a live session's time/link. Same UID + a higher SEQUENCE (derived from the
 * lesson's updatedAt) with METHOD:REQUEST so calendars update the existing event.
 */
export async function processNotifyCourseSessionUpdate(rawPayload: unknown): Promise<UpdateResult> {
  const { courseId, lessonId } = ZNotifyCourseSessionUpdatePayload.parse(rawPayload);

  const [courseRows, orgData, lesson] = await Promise.all([
    getCourseById(courseId),
    getCourseWithOrgData(courseId),
    getLessonById(lessonId)
  ]);

  const course = courseRows?.[0];
  if (!course || !orgData || !lesson || !lesson.lessonAt || !lesson.callUrl) {
    log.warn('notify-session-update-skipped', { courseId, lessonId, reason: 'missing session data' });
    return { notified: 0 };
  }

  const sessionTimezone = course.metadata?.sessionTimezone ?? null;
  const orgName = orgData.orgName || 'ClassroomIO';
  const branding = buildEmailBranding({
    name: orgData.orgName,
    avatarUrl: orgData.orgAvatarUrl,
    theme: orgData.orgTheme
  });
  const sessionTimeLabel = formatSessionTime(lesson.lessonAt, sessionTimezone);
  const sequence = Math.floor(Date.parse(lesson.updatedAt ?? new Date().toISOString()) / 1000);

  const ics = buildSessionIcs({
    uid: `session-${lesson.id}@classroomio`,
    sequence,
    method: 'REQUEST',
    start: lesson.lessonAt,
    title: lesson.title,
    description: `Join your live session: ${lesson.callUrl}`,
    url: lesson.callUrl,
    alarmsBeforeMinutes: [1440, 60]
  });

  const members = await getCourseMembers(courseId);
  const recipients = members
    .filter((member) => member.roleId === ROLE.STUDENT)
    .map((member) => member.profile?.email)
    .filter((email): email is string => !!email);

  let notified = 0;
  for (const email of recipients) {
    try {
      await enqueueEmailSend(
        {
          kind: 'template',
          template: 'sessionUpdated',
          to: email,
          fields: {
            orgName,
            courseName: course.title,
            sessionTitle: lesson.title,
            sessionTimeLabel,
            joinUrl: lesson.callUrl,
            branding
          },
          from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
          ics
        },
        { idempotencyKey: `session-updated:${lesson.id}:${email}:${sequence}` }
      );
      notified += 1;
    } catch (error) {
      log.error('notify-session-update-enqueue-failed', { lessonId, recipient: email });
    }
  }

  log.info('notify-session-update-done', { courseId, lessonId, notified });

  return { notified };
}
