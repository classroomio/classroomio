import {
  createCommentReply,
  createCommentThread,
  getCommentThreadById,
  listCommentThreadsByNoteId,
  touchCommentThread,
  updateCommentThreadStatus
} from '@cio/db/queries/notes';
import { getNoteById, insertNoteVersion, updateNote } from '@cio/db/queries/notes';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TCreateNoteCommentReply,
  TCreateNoteCommentThread,
  TUpdateNoteCommentThread
} from '@cio/utils/validation/notes';
import { assertNoteCommentAccess, assertNoteReadAccess, assertNoteThreadResolveAccess } from './access';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getReadableNote(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  assertNoteReadAccess({ note, organizationId, userId, roleId });

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

  const threads = await listCommentThreadsByNoteId(noteId);

  return threads.find((item) => item.id === threadId) ?? updated;
}
