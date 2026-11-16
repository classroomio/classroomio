import {
  getCourseCommentThread,
  insertCourseComment,
  insertCourseCommentThread,
  insertCourseCommentThreadEvent,
  listCourseCommentsForThreads,
  listCourseCommentTeam,
  listCourseCommentThreadRows,
  markAllCourseCommentThreadsRead,
  setCourseCommentThreadStatus,
  upsertCourseCommentThreadRead,
  type TCourseCommentTeamMember
} from '@cio/db/queries/course-comment';
import { getProfileById } from '@cio/db/queries/auth';
import {
  markCourseCommentNotificationsReadForCourse,
  markCourseCommentThreadNotificationsRead
} from '@cio/db/queries/notifications';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import type { TCourseCommentThread } from '@cio/db/types';
import type { TCourseCommentThreadStatus } from '@cio/utils/constants/course-comment';
import type { TCourseCommentMention } from '@cio/utils/functions/course-comment-mentions';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TCreateCourseCommentThread } from '@cio/utils/validation/course-comment';

import { assertTeamCommentsEnabled } from './access';
import { resolveCourseCommentAnchor } from './anchors';
import { publishCourseCommentEvent } from './events';
import { dispatchCommentNotifications } from './notifications';
import { toCourseCommentThreadViews, type TCourseCommentThreadView, type TCourseCommentViewer } from './presenter';

export function toViewer(profileId: string, team: TCourseCommentTeamMember[]): TCourseCommentViewer {
  const member = team.find((teamMember) => teamMember.profileId === profileId);

  return { profileId, isOrgAdmin: member?.role === 'org_admin' };
}

/** Drops mentions of people who are not on the course team; their `@Name` stays as plain text. */
export function keepTeamMentions(
  mentions: TCourseCommentMention[],
  team: TCourseCommentTeamMember[]
): TCourseCommentMention[] {
  const teamIds = new Set(team.map((member) => member.profileId));

  return mentions.filter((mention) => teamIds.has(mention.profileId));
}

export function threadNotFound(): AppError {
  return new AppError('Comment thread not found', ErrorCodes.COURSE_COMMENT_THREAD_NOT_FOUND, 404);
}

/**
 * The thread when it belongs to the course. Throws 404 otherwise.
 */
export async function requireCourseCommentThread(
  courseId: string,
  threadId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentThread> {
  const thread = await getCourseCommentThread(courseId, threadId, dbClient);
  if (!thread) throw threadNotFound();

  return thread;
}

async function loadThreadViews(input: {
  courseId: string;
  viewerId: string;
  status: TCourseCommentThreadStatus | 'all';
  threadIds?: string[];
  team?: TCourseCommentTeamMember[];
}): Promise<TCourseCommentThreadView[]> {
  const team = input.team ?? (await listCourseCommentTeam(input.courseId));
  const rows = await listCourseCommentThreadRows({
    courseId: input.courseId,
    viewerId: input.viewerId,
    status: input.status,
    threadIds: input.threadIds
  });
  const comments = await listCourseCommentsForThreads(rows.map((row) => row.thread.id));

  return toCourseCommentThreadViews({ rows, comments, team, viewer: toViewer(input.viewerId, team) });
}

export async function listCourseCommentThreadViews(
  courseId: string,
  viewerId: string,
  status: TCourseCommentThreadStatus | 'all'
): Promise<TCourseCommentThreadView[]> {
  await assertTeamCommentsEnabled(courseId);

  return loadThreadViews({ courseId, viewerId, status });
}

export async function getCourseCommentThreadView(
  courseId: string,
  threadId: string,
  viewerId: string,
  team?: TCourseCommentTeamMember[]
): Promise<TCourseCommentThreadView> {
  const [view] = await loadThreadViews({ courseId, viewerId, status: 'all', threadIds: [threadId], team });
  if (!view) throw threadNotFound();

  return view;
}

/** One thread for a request: checks the org switch, then 404s unless it belongs to the course. */
export async function readCourseCommentThread(
  courseId: string,
  threadId: string,
  viewerId: string
): Promise<TCourseCommentThreadView> {
  await assertTeamCommentsEnabled(courseId);

  return getCourseCommentThreadView(courseId, threadId, viewerId);
}

export async function createCourseCommentThread(input: {
  courseId: string;
  actorId: string;
  data: TCreateCourseCommentThread;
}): Promise<TCourseCommentThreadView> {
  const context = await assertTeamCommentsEnabled(input.courseId);
  const team = await listCourseCommentTeam(input.courseId);
  const mentions = keepTeamMentions(input.data.mentions, team);

  const created = await db.transaction(async (tx) => {
    const anchorColumns = await resolveCourseCommentAnchor(input.courseId, input.data.anchor, tx);
    const thread = await insertCourseCommentThread(
      {
        organizationId: context.organizationId,
        courseId: input.courseId,
        createdBy: input.actorId,
        ...anchorColumns
      },
      tx
    );
    const comment = await insertCourseComment(
      { threadId: thread.id, authorId: input.actorId, body: input.data.body, mentions },
      tx
    );
    await upsertCourseCommentThreadRead(thread.id, input.actorId, tx);

    return { thread, comment };
  });

  await dispatchCommentNotifications({
    kind: 'created',
    organizationId: context.organizationId,
    courseId: input.courseId,
    threadId: created.thread.id,
    actorId: input.actorId,
    team,
    commentId: created.comment.id,
    mentions
  });
  await publishCourseCommentEvent(input.courseId, { type: 'thread.changed', threadId: created.thread.id });

  return getCourseCommentThreadView(input.courseId, created.thread.id, input.actorId, team);
}

async function setThreadStatus(input: {
  courseId: string;
  threadId: string;
  actorId: string;
  status: TCourseCommentThreadStatus;
}): Promise<TCourseCommentThreadView> {
  const context = await assertTeamCommentsEnabled(input.courseId);
  const thread = await requireCourseCommentThread(input.courseId, input.threadId);
  const actor = await getProfileById(input.actorId);

  const changed = await db.transaction(async (tx) => {
    const updated = await setCourseCommentThreadStatus(
      { threadId: thread.id, status: input.status, actorId: input.actorId },
      tx
    );
    if (!updated) return null;

    await insertCourseCommentThreadEvent(
      {
        threadId: thread.id,
        type: input.status === 'resolved' ? 'resolved' : 'reopened',
        actorId: input.actorId,
        actorName: actor?.fullname ?? ''
      },
      tx
    );

    return updated;
  });

  const team = await listCourseCommentTeam(input.courseId);

  if (changed) {
    if (input.status === 'resolved') {
      await dispatchCommentNotifications({
        kind: 'resolved',
        organizationId: context.organizationId,
        courseId: input.courseId,
        threadId: thread.id,
        actorId: input.actorId,
        team,
        threadCreatorId: thread.createdBy
      });
    }

    await publishCourseCommentEvent(input.courseId, { type: 'thread.changed', threadId: thread.id });
  }

  return getCourseCommentThreadView(input.courseId, thread.id, input.actorId, team);
}

export async function resolveCourseCommentThread(input: {
  courseId: string;
  threadId: string;
  actorId: string;
}): Promise<TCourseCommentThreadView> {
  return setThreadStatus({ ...input, status: 'resolved' });
}

export async function reopenCourseCommentThread(input: {
  courseId: string;
  threadId: string;
  actorId: string;
}): Promise<TCourseCommentThreadView> {
  return setThreadStatus({ ...input, status: 'open' });
}

/** Marks a thread and its bell notifications read for the actor. Never changes the thread's status. */
export async function markCourseCommentThreadRead(input: {
  courseId: string;
  threadId: string;
  actorId: string;
}): Promise<void> {
  await assertTeamCommentsEnabled(input.courseId);
  const thread = await requireCourseCommentThread(input.courseId, input.threadId);

  await upsertCourseCommentThreadRead(thread.id, input.actorId);
  await markCourseCommentThreadNotificationsRead([thread.id], input.actorId);
}

export async function markAllCourseCommentsRead(input: { courseId: string; actorId: string }): Promise<void> {
  await assertTeamCommentsEnabled(input.courseId);
  await markAllCourseCommentThreadsRead(input.courseId, input.actorId);
  await markCourseCommentNotificationsReadForCourse(input.courseId, input.actorId);
}
