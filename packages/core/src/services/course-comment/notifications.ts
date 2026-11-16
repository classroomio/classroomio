import { enqueueCourseCommentDigest, isRedisConfigured } from '@cio/jobs';
import { listCourseCommentThreadParticipantIds, type TCourseCommentTeamMember } from '@cio/db/queries/course-comment';
import { insertNotifications } from '@cio/db/queries/notifications';
import type { TNewNotification } from '@cio/db/types';
import { NOTIFICATION_KINDS, type TNotificationKind } from '@cio/utils/constants/notification';
import { getMentionedProfileIds, type TCourseCommentMention } from '@cio/utils/functions/course-comment-mentions';

import { publishCourseCommentEvent } from './events';

interface TCommentNotificationBase {
  organizationId: string;
  courseId: string;
  threadId: string;
  actorId: string;
  team: TCourseCommentTeamMember[];
}

export type TCommentNotificationEvent = TCommentNotificationBase &
  (
    | { kind: 'created'; commentId: string; mentions: TCourseCommentMention[] }
    | { kind: 'replied'; commentId: string; mentions: TCourseCommentMention[] }
    | {
        kind: 'edited';
        commentId: string;
        mentions: TCourseCommentMention[];
        previousMentions: TCourseCommentMention[];
      }
    | { kind: 'resolved'; threadCreatorId: string | null }
  );

async function collectRecipients(event: TCommentNotificationEvent): Promise<Map<string, TNotificationKind>> {
  const recipients = new Map<string, TNotificationKind>();

  if (event.kind === 'resolved') {
    if (event.threadCreatorId) recipients.set(event.threadCreatorId, NOTIFICATION_KINDS.courseCommentResolved);

    return recipients;
  }

  const previouslyMentioned = new Set(event.kind === 'edited' ? getMentionedProfileIds(event.previousMentions) : []);
  for (const profileId of getMentionedProfileIds(event.mentions)) {
    if (!previouslyMentioned.has(profileId)) recipients.set(profileId, NOTIFICATION_KINDS.courseCommentMentioned);
  }

  if (event.kind === 'replied') {
    const participants = await listCourseCommentThreadParticipantIds(event.threadId);
    for (const profileId of participants) {
      if (!recipients.has(profileId)) recipients.set(profileId, NOTIFICATION_KINDS.courseCommentReplied);
    }
  }

  return recipients;
}

/**
 * Records bell notifications for a comment event and schedules their email digests. The actor is
 * never notified, and nor is anyone who is no longer on the course team. Failures are logged and
 * never undo the comment that caused them.
 */
export async function dispatchCommentNotifications(event: TCommentNotificationEvent): Promise<void> {
  try {
    const teamIds = new Set(event.team.map((member) => member.profileId));
    const recipients = await collectRecipients(event);
    const commentId = event.kind === 'resolved' ? null : event.commentId;

    const rows: TNewNotification[] = [...recipients]
      .filter(([profileId]) => profileId !== event.actorId && teamIds.has(profileId))
      .map(([recipientId, kind]) => ({
        organizationId: event.organizationId,
        recipientId,
        actorId: event.actorId,
        kind,
        courseId: event.courseId,
        courseCommentThreadId: event.threadId,
        courseCommentId: commentId
      }));

    if (rows.length === 0) return;

    await insertNotifications(rows);
    await Promise.all(rows.map((row) => notifyRecipient(event, row.recipientId)));
  } catch (error) {
    console.error('dispatchCommentNotifications error:', error);
  }
}

async function notifyRecipient(event: TCommentNotificationEvent, recipientId: string): Promise<void> {
  await publishCourseCommentEvent(event.courseId, { type: 'notifications.changed', profileId: recipientId });
  if (!isRedisConfigured()) return;

  try {
    await enqueueCourseCommentDigest({
      organizationId: event.organizationId,
      courseId: event.courseId,
      threadId: event.threadId,
      recipientId
    });
  } catch (error) {
    console.error('enqueueCourseCommentDigest error:', error);
  }
}
