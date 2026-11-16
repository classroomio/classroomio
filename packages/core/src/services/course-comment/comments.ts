import {
  deleteCourseCommentRow,
  deleteCourseCommentThread,
  getCourseComment,
  getFirstCourseCommentId,
  insertCourseComment,
  insertCourseCommentThreadEvent,
  listCourseCommentTeam,
  setCourseCommentThreadStatus,
  touchCourseCommentThread,
  updateCourseCommentBody,
  upsertCourseCommentThreadRead
} from '@cio/db/queries/course-comment';
import { getProfileById } from '@cio/db/queries/auth';
import { db } from '@cio/db/drizzle';
import type { TCourseComment } from '@cio/db/types';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TCourseCommentWrite } from '@cio/utils/validation/course-comment';

import { assertTeamCommentsEnabled } from './access';
import { publishCourseCommentEvent } from './events';
import { dispatchCommentNotifications } from './notifications';
import type { TCourseCommentThreadView } from './presenter';
import { getCourseCommentThreadView, keepTeamMentions, requireCourseCommentThread, toViewer } from './threads';

async function requireComment(threadId: string, commentId: string): Promise<TCourseComment> {
  const comment = await getCourseComment(threadId, commentId);
  if (!comment) throw new AppError('Comment not found', ErrorCodes.COURSE_COMMENT_NOT_FOUND, 404);

  return comment;
}

function forbidden(message: string): AppError {
  return new AppError(message, ErrorCodes.COURSE_COMMENT_FORBIDDEN, 403);
}

/**
 * Adds a reply. Replying to a resolved thread reopens it.
 */
export async function replyToCourseCommentThread(input: {
  courseId: string;
  threadId: string;
  actorId: string;
  data: TCourseCommentWrite;
}): Promise<TCourseCommentThreadView> {
  const context = await assertTeamCommentsEnabled(input.courseId);
  const thread = await requireCourseCommentThread(input.courseId, input.threadId);
  const team = await listCourseCommentTeam(input.courseId);
  const mentions = keepTeamMentions(input.data.mentions, team);
  const actor = thread.status === 'resolved' ? await getProfileById(input.actorId) : null;

  const comment = await db.transaction(async (tx) => {
    const created = await insertCourseComment(
      { threadId: thread.id, authorId: input.actorId, body: input.data.body, mentions },
      tx
    );

    if (thread.status === 'resolved') {
      const reopened = await setCourseCommentThreadStatus(
        { threadId: thread.id, status: 'open', actorId: input.actorId },
        tx
      );
      if (reopened) {
        await insertCourseCommentThreadEvent(
          { threadId: thread.id, type: 'reopened', actorId: input.actorId, actorName: actor?.fullname ?? '' },
          tx
        );
      }
    } else {
      await touchCourseCommentThread(thread.id, tx);
    }

    await upsertCourseCommentThreadRead(thread.id, input.actorId, tx);

    return created;
  });

  await dispatchCommentNotifications({
    kind: 'replied',
    organizationId: context.organizationId,
    courseId: input.courseId,
    threadId: thread.id,
    actorId: input.actorId,
    team,
    commentId: comment.id,
    mentions
  });
  await publishCourseCommentEvent(input.courseId, { type: 'thread.changed', threadId: thread.id });

  return getCourseCommentThreadView(input.courseId, thread.id, input.actorId, team);
}

/**
 * Replaces the text and mentions of the actor's own comment. Only newly added mentions are notified.
 */
export async function editCourseComment(input: {
  courseId: string;
  threadId: string;
  commentId: string;
  actorId: string;
  data: TCourseCommentWrite;
}): Promise<TCourseCommentThreadView> {
  const context = await assertTeamCommentsEnabled(input.courseId);
  const thread = await requireCourseCommentThread(input.courseId, input.threadId);
  const comment = await requireComment(thread.id, input.commentId);
  if (comment.authorId !== input.actorId) throw forbidden('You can only edit your own comments');

  const team = await listCourseCommentTeam(input.courseId);
  const mentions = keepTeamMentions(input.data.mentions, team);

  await db.transaction(async (tx) => {
    await updateCourseCommentBody(comment.id, { body: input.data.body, mentions }, tx);
    await touchCourseCommentThread(thread.id, tx);
  });

  await dispatchCommentNotifications({
    kind: 'edited',
    organizationId: context.organizationId,
    courseId: input.courseId,
    threadId: thread.id,
    actorId: input.actorId,
    team,
    commentId: comment.id,
    mentions,
    previousMentions: comment.mentions
  });
  await publishCourseCommentEvent(input.courseId, { type: 'thread.changed', threadId: thread.id });

  return getCourseCommentThreadView(input.courseId, thread.id, input.actorId, team);
}

/**
 * Deletes a comment. Authors can delete their own; org admins can delete any. Deleting the first
 * comment deletes the whole thread.
 */
export async function deleteCourseComment(input: {
  courseId: string;
  threadId: string;
  commentId: string;
  actorId: string;
}): Promise<{ threadDeleted: boolean }> {
  await assertTeamCommentsEnabled(input.courseId);
  const thread = await requireCourseCommentThread(input.courseId, input.threadId);
  const comment = await requireComment(thread.id, input.commentId);
  const team = await listCourseCommentTeam(input.courseId);
  const viewer = toViewer(input.actorId, team);

  if (comment.authorId !== input.actorId && !viewer.isOrgAdmin) {
    throw forbidden('Only the author or an organization admin can delete this comment');
  }

  const firstCommentId = await getFirstCourseCommentId(thread.id);
  const threadDeleted = firstCommentId === comment.id;

  await db.transaction(async (tx) => {
    if (threadDeleted) {
      await deleteCourseCommentThread(thread.id, tx);
      return;
    }

    await deleteCourseCommentRow(comment.id, tx);
    await touchCourseCommentThread(thread.id, tx);
  });

  await publishCourseCommentEvent(input.courseId, {
    type: threadDeleted ? 'thread.deleted' : 'thread.changed',
    threadId: thread.id
  });

  return { threadDeleted };
}
