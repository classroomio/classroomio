import {
  createCommentReply,
  createCommentThread,
  getCommentById,
  getCommentThreadById,
  getMentionedProfileEmails,
  getNoteCommentEmailContext,
  getThreadParticipantEmails,
  listCommentThreadsByNoteId,
  replaceCommentMentions,
  softDeleteComment,
  touchCommentThread,
  updateCommentBody,
  updateCommentThreadStatus,
  type NoteCommentThreadRow
} from '@cio/db/queries/notes';
import { getNoteById, updateNote } from '@cio/db/queries/notes';
import { getNoteSharePermission } from '@cio/db/queries/notes/share';
import { env } from '@cio/core/config/env';
import { publishNoteCommentEvent } from '@cio/core/utils/redis/note-comments-pubsub';
import { formatMentionsForEmail, parseUserMentions } from '@cio/utils/functions/note-comment-mentions';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TCreateNoteCommentReply,
  TCreateNoteCommentThread,
  TUpdateNoteComment,
  TUpdateNoteCommentThread
} from '@cio/utils/validation/notes';
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs/email-jobs';
import {
  assertNoteCommentAccess,
  assertNoteCommentAuthorAccess,
  assertNoteThreadResolveAccess,
  resolveNoteAccess
} from './access';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNoteCommentLink(siteName: string, noteId: string, threadId: string): string {
  const origin = env.DASHBOARD_ORIGIN?.trim().replace(/\/$/, '') || 'http://localhost:5173';

  return `${origin}/org/${siteName}/notes/${noteId}?thread=${threadId}`;
}

async function getReadableNote(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(noteId, userId);
  const access = resolveNoteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (!access.canRead) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return note;
}

async function persistNoteContent(params: { noteId: string; userId: string; content: string; changeSource: string }) {
  const plainText = htmlToPlainText(params.content);
  const existing = await getNoteById(params.noteId);

  if (!existing) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const updated = await updateNote(params.noteId, {
    content: params.content,
    plainText,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  await insertNoteVersion({
    noteId: params.noteId,
    oldContent: existing.content,
    newContent: params.content,
    changedBy: params.userId,
    changeSource: params.changeSource
  });

  return updated;
}

async function persistCommentMentions(commentId: string, body: string) {
  const mentions = parseUserMentions(body);
  await replaceCommentMentions(
    commentId,
    mentions.map((mention) => mention.profileId)
  );

  return mentions;
}

async function sendNoteCommentMentionEmails(params: { commentId: string; authorProfileId: string }) {
  try {
    const context = await getNoteCommentEmailContext(params.commentId);

    if (!context?.orgSiteName) {
      return;
    }

    const mentions = parseUserMentions(context.commentBody);
    const mentionProfileIds = mentions
      .map((mention) => mention.profileId)
      .filter((profileId) => profileId !== params.authorProfileId);

    if (mentionProfileIds.length === 0) {
      return;
    }

    const recipients = await getMentionedProfileEmails(mentionProfileIds);
    const noteLink = buildNoteCommentLink(context.orgSiteName, context.noteId, context.threadId);
    const branding = buildEmailBranding({
      name: context.orgName,
      avatarUrl: context.orgAvatarUrl,
      theme: context.orgTheme
    });
    const authorName = context.authorFullname || 'A teammate';
    const comment = formatMentionsForEmail(context.commentBody);

    for (const recipient of recipients) {
      if (recipient.profileId === params.authorProfileId) {
        continue;
      }

      await enqueueTransactionalEmail('noteCommentMention', {
        to: recipient.email,
        fields: {
          noteTitle: context.noteTitle,
          authorName,
          comment,
          noteLink,
          orgName: context.orgName,
          branding
        },
        from: buildEmailFromName(`${context.orgName} - ClassroomIO`),
        replyTo: 'noreply@classroomio.com',
        idempotencyKey: `note-comment-mention:${params.commentId}:${recipient.profileId}`
      });
    }
  } catch (error) {
    console.error('sendNoteCommentMentionEmails error:', error);
  }
}

async function sendNoteCommentReplyEmails(params: { commentId: string; threadId: string; authorProfileId: string }) {
  try {
    const context = await getNoteCommentEmailContext(params.commentId);

    if (!context?.orgSiteName) {
      return;
    }

    const mentionedProfileIds = new Set(parseUserMentions(context.commentBody).map((mention) => mention.profileId));
    const participantEmails = await getThreadParticipantEmails({
      threadId: params.threadId,
      excludeProfileId: params.authorProfileId
    });

    const noteLink = buildNoteCommentLink(context.orgSiteName, context.noteId, context.threadId);
    const branding = buildEmailBranding({
      name: context.orgName,
      avatarUrl: context.orgAvatarUrl,
      theme: context.orgTheme
    });
    const authorName = context.authorFullname || 'A teammate';
    const comment = formatMentionsForEmail(context.commentBody);

    for (const email of participantEmails) {
      await enqueueTransactionalEmail('noteCommentReply', {
        to: email,
        fields: {
          noteTitle: context.noteTitle,
          authorName,
          comment,
          noteLink,
          orgName: context.orgName,
          branding
        },
        from: buildEmailFromName(`${context.orgName} - ClassroomIO`),
        replyTo: 'noreply@classroomio.com',
        idempotencyKey: `note-comment-reply:${params.commentId}:${email}`
      });
    }

    void mentionedProfileIds;
  } catch (error) {
    console.error('sendNoteCommentReplyEmails error:', error);
  }
}

export async function listNoteCommentThreadsService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string
) {
  await getReadableNote(organizationId, userId, roleId, noteId);

  return listCommentThreadsByNoteId(noteId);
}

export async function createNoteCommentThreadService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TCreateNoteCommentThread
) {
  const note = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteCommentAccess({ note, organizationId, userId, roleId });

  if (data.threadId !== data.anchor.threadId) {
    throw new AppError('Thread id mismatch', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (data.anchor.threadId !== data.threadId) {
    throw new AppError('Invalid anchor', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await persistNoteContent({
    noteId,
    userId,
    content: data.content,
    changeSource: 'comment_create'
  });

  const thread = await createCommentThread({
    thread: {
      id: data.threadId,
      noteId,
      status: 'open',
      anchor: data.anchor,
      createdBy: userId,
      authorType: 'user'
    },
    comment: {
      authorId: userId,
      authorType: 'user',
      body: data.body.trim()
    }
  });

  const firstComment = thread.comments[0];

  if (firstComment) {
    await persistCommentMentions(firstComment.id, firstComment.body);
    void sendNoteCommentMentionEmails({ commentId: firstComment.id, authorProfileId: userId });
  }

  await publishNoteCommentEvent(noteId, {
    type: 'thread_created',
    threadId: thread.id,
    commentId: firstComment?.id
  });

  const threads = await listCommentThreadsByNoteId(noteId);
  const created = threads.find((item: NoteCommentThreadRow) => item.id === thread.id);

  return created ?? thread;
}

export async function createNoteCommentReplyService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  threadId: string,
  data: TCreateNoteCommentReply
) {
  const note = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteCommentAccess({ note, organizationId, userId, roleId });

  const thread = await getCommentThreadById(threadId);

  if (!thread || thread.noteId !== noteId) {
    throw new AppError('Comment thread not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  const comment = await createCommentReply({
    threadId,
    authorId: userId,
    authorType: 'user',
    body: data.body.trim()
  });

  await touchCommentThread(threadId);
  await persistCommentMentions(comment.id, comment.body);
  void sendNoteCommentMentionEmails({ commentId: comment.id, authorProfileId: userId });
  void sendNoteCommentReplyEmails({ commentId: comment.id, threadId, authorProfileId: userId });

  await publishNoteCommentEvent(noteId, {
    type: 'reply',
    threadId,
    commentId: comment.id
  });

  const threads = await listCommentThreadsByNoteId(noteId);
  const updatedThread = threads.find((item) => item.id === threadId);

  return {
    thread: updatedThread,
    comment
  };
}

export async function updateNoteCommentThreadService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  threadId: string,
  data: TUpdateNoteCommentThread
) {
  const note = await getReadableNote(organizationId, userId, roleId, noteId);

  const thread = await getCommentThreadById(threadId);

  if (!thread || thread.noteId !== noteId) {
    throw new AppError('Comment thread not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  assertNoteThreadResolveAccess({ note, userId, threadCreatedBy: thread.createdBy });

  if (data.content) {
    await persistNoteContent({
      noteId,
      userId,
      content: data.content,
      changeSource: data.status === 'resolved' ? 'comment_resolve' : 'comment_reopen'
    });
  }

  const updated = await updateCommentThreadStatus({
    threadId,
    status: data.status,
    resolvedBy: data.status === 'resolved' ? userId : null
  });

  if (!updated) {
    throw new AppError('Comment thread not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  await publishNoteCommentEvent(noteId, {
    type: 'thread_updated',
    threadId
  });

  const threads = await listCommentThreadsByNoteId(noteId);

  return threads.find((item) => item.id === threadId) ?? updated;
}

export async function updateNoteCommentService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  commentId: string,
  data: TUpdateNoteComment
) {
  const note = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteCommentAccess({ note, organizationId, userId, roleId });

  const comment = await getCommentById(commentId);

  if (!comment) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  const thread = await getCommentThreadById(comment.threadId);

  if (!thread || thread.noteId !== noteId) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  assertNoteCommentAuthorAccess({ userId, authorId: comment.authorId });

  const updated = await updateCommentBody(commentId, data.body.trim());

  if (!updated) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  await persistCommentMentions(commentId, updated.body);
  void sendNoteCommentMentionEmails({ commentId, authorProfileId: userId });

  await publishNoteCommentEvent(noteId, {
    type: 'comment_updated',
    threadId: comment.threadId,
    commentId
  });

  const threads = await listCommentThreadsByNoteId(noteId);
  const updatedThread = threads.find((item) => item.id === comment.threadId);

  return {
    thread: updatedThread,
    comment: updated
  };
}

export async function deleteNoteCommentService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  commentId: string
) {
  const note = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteCommentAccess({ note, organizationId, userId, roleId });

  const comment = await getCommentById(commentId);

  if (!comment) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  const thread = await getCommentThreadById(comment.threadId);

  if (!thread || thread.noteId !== noteId) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  assertNoteCommentAuthorAccess({ userId, authorId: comment.authorId });

  const deleted = await softDeleteComment(commentId);

  if (!deleted) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  await replaceCommentMentions(commentId, []);
  await touchCommentThread(comment.threadId);

  await publishNoteCommentEvent(noteId, {
    type: 'comment_deleted',
    threadId: comment.threadId,
    commentId
  });

  const threads = await listCommentThreadsByNoteId(noteId);
  const updatedThread = threads.find((item) => item.id === comment.threadId);

  return {
    thread: updatedThread,
    commentId
  };
}

export async function assertNoteCommentStreamAccess(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string
) {
  await getReadableNote(organizationId, userId, roleId, noteId);
}
