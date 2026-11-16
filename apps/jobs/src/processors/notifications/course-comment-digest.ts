import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { canUseCourseComments } from '@cio/core/services/course-comment/access';
import { getProfileById } from '@cio/db/queries/auth';
import { getCourseWithOrgData } from '@cio/db/queries/course';
import { getExerciseById } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import {
  EmailPreferenceLookupCache,
  listPendingCourseCommentDigestNotifications,
  markNotificationsEmailed,
  type TNotificationRow
} from '@cio/db/queries/notifications';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { ZCourseCommentDigestPayload, enqueueEmailSend } from '@cio/jobs';
import { COURSE_COMMENT_DIGEST_MAX_ITEMS } from '@cio/utils/constants/course-comment';
import { NOTIFICATION_KINDS } from '@cio/utils/constants/notification';
import { buildCourseCommentThreadPath } from '@cio/utils/functions/course-comment-links';
import { toCourseCommentSnippet } from '@cio/utils/functions/course-comment-mentions';

import { log } from '../../utils/logger';

export type TCourseCommentDigestSkipReason = 'nothing_pending' | 'no_access' | 'opted_out' | 'no_email' | 'no_course';

export interface TCourseCommentDigestResult {
  sent: boolean;
  notificationCount: number;
  skipped?: TCourseCommentDigestSkipReason;
}

const ACTION_BY_KIND = {
  [NOTIFICATION_KINDS.courseCommentMentioned]: 'mentioned',
  [NOTIFICATION_KINDS.courseCommentReplied]: 'replied',
  [NOTIFICATION_KINDS.courseCommentResolved]: 'resolved'
} as const;

function toDigestItem(row: TNotificationRow) {
  const action = ACTION_BY_KIND[row.kind as keyof typeof ACTION_BY_KIND] ?? 'replied';
  const actorName = row.actorFullname || 'A teammate';
  const snippet = action === 'resolved' ? null : toCourseCommentSnippet(row.commentBody);

  return { actorName, action, snippet };
}

async function getLocationLabel(row: TNotificationRow): Promise<string | null> {
  if (row.threadLessonId) {
    const lesson = await getLessonById(row.threadLessonId);

    return lesson?.title || null;
  }
  if (row.threadExerciseId) {
    const exercise = await getExerciseById(row.threadExerciseId);

    return exercise?.title || null;
  }

  return null;
}

/**
 * Process a `notifications:course-comment-digest` job: one email summing up a recipient's
 * unread, un-emailed notifications on one thread. Notifications that will never be emailed
 * (access lost, email turned off) are marked emailed so a later digest does not pick them up.
 */
export async function processCourseCommentDigest(rawPayload: unknown): Promise<TCourseCommentDigestResult> {
  const payload = ZCourseCommentDigestPayload.parse(rawPayload);
  const pending = await listPendingCourseCommentDigestNotifications(payload.threadId, payload.recipientId);
  if (pending.length === 0) return { sent: false, notificationCount: 0, skipped: 'nothing_pending' };

  const notificationIds = pending.map((row) => row.id);
  const skip = async (reason: TCourseCommentDigestSkipReason): Promise<TCourseCommentDigestResult> => {
    await markNotificationsEmailed(notificationIds);
    log.info('course-comment-digest-skipped', { threadId: payload.threadId, reason });

    return { sent: false, notificationCount: pending.length, skipped: reason };
  };

  const hasAccess = await canUseCourseComments(payload.courseId, payload.recipientId);
  if (!hasAccess) return skip('no_access');

  const recipient = await getProfileById(payload.recipientId);
  if (!recipient?.email) return skip('no_email');

  const preferences = new EmailPreferenceLookupCache();
  const allowed = await preferences.shouldSend({
    emailId: 'courseCommentDigest',
    organizationId: payload.organizationId,
    recipientEmail: recipient.email,
    recipientProfileId: recipient.id
  });
  if (!allowed) return skip('opted_out');

  const course = await getCourseWithOrgData(payload.courseId);
  if (!course) return skip('no_course');

  const newest = pending[0];
  const locationLabel = await getLocationLabel(newest);
  const threadPath = buildCourseCommentThreadPath(payload.courseId, {
    threadId: payload.threadId,
    lessonId: newest.threadLessonId,
    exerciseId: newest.threadExerciseId
  });
  const branding = buildEmailBranding({ name: course.orgName, avatarUrl: course.orgAvatarUrl, theme: course.orgTheme });
  const orgName = course.orgName || 'ClassroomIO';
  const items = pending.slice(0, COURSE_COMMENT_DIGEST_MAX_ITEMS).map(toDigestItem);
  const moreCount = Math.max(pending.length - COURSE_COMMENT_DIGEST_MAX_ITEMS, 0);

  await enqueueEmailSend(
    {
      kind: 'template',
      template: 'courseCommentDigest',
      to: recipient.email,
      fields: {
        courseTitle: course.courseTitle || 'your course',
        locationLabel,
        items,
        moreCount,
        threadUrl: `${getAppBaseUrl()}${threadPath}`,
        branding
      },
      from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
      organizationId: payload.organizationId
    },
    { idempotencyKey: `course-comment-digest:${newest.id}` }
  );
  await markNotificationsEmailed(notificationIds);

  log.info('course-comment-digest-sent', { threadId: payload.threadId, notificationCount: pending.length });

  return { sent: true, notificationCount: pending.length };
}
