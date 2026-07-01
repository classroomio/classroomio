import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countWorkspaceNotesByOwner,
  createNote,
  getLessonCaptureNote,
  getNoteById,
  getNoteVersionById,
  getNoteVersionHistory,
  insertNoteVersion,
  listNotesByOwner,
  softDeleteNote,
  updateNote,
  type NoteListRow
} from '@cio/db/queries/notes';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { verifyLessonBelongsToCourse } from '@cio/core/services/agent/chat-context';
import { BASIC_WORKSPACE_NOTE_LIMIT, PLAN } from '@cio/utils/plans/constants';
import type {
  TCreateNote,
  TListNotesQuery,
  TNoteOrigin,
  TNoteTagAssignment,
  TUpdateNote
} from '@cio/utils/validation/notes';
import type { TPlan } from '@db/types';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getOrganizationPlanName(orgId: string): Promise<TPlan> {
  const activePlan = await getActiveOrganizationPlan(orgId);
  const planName = activePlan?.planName;

  if (planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE || planName === PLAN.BASIC) {
    return planName;
  }

  return 'BASIC';
}

export async function assertWorkspaceNoteCreationAllowed(organizationId: string, ownerId: string): Promise<void> {
  const planName = await getOrganizationPlanName(organizationId);

  if (planName !== PLAN.BASIC) {
    return;
  }

  const workspaceCount = await countWorkspaceNotesByOwner(organizationId, ownerId);

  if (workspaceCount >= BASIC_WORKSPACE_NOTE_LIMIT) {
    throw new AppError(
      `Your plan allows up to ${BASIC_WORKSPACE_NOTE_LIMIT} workspace notes`,
      ErrorCodes.NOTES_LIMIT_REACHED,
      403
    );
  }
}

function assertNoteOwnership(note: NoteListRow, organizationId: string, ownerId: string) {
  if (note.organizationId !== organizationId || note.ownerId !== ownerId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }
}

async function validateLessonCaptureContext(params: { organizationId: string; courseId?: string; lessonId?: string }) {
  if (!params.lessonId || !params.courseId) {
    throw new AppError('Lesson capture notes require courseId and lessonId', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await verifyLessonBelongsToCourse(params.lessonId, params.courseId);
}

export async function listNotesService(organizationId: string, ownerId: string, query: TListNotesQuery) {
  const notes = await listNotesByOwner({
    organizationId,
    ownerId,
    origin: query.origin,
    courseId: query.courseId,
    lessonId: query.lessonId,
    search: query.search,
    tagId: query.tagId
  });

  const { attachTagsToNotes } = await import('./tags');

  return attachTagsToNotes(organizationId, notes);
}

export async function getNoteService(organizationId: string, ownerId: string, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  assertNoteOwnership(note, organizationId, ownerId);

  return note;
}

export async function createNoteService(ownerId: string, data: TCreateNote) {
  if (data.organizationId && data.origin === 'workspace') {
    await assertWorkspaceNoteCreationAllowed(data.organizationId, ownerId);
  }

  if (data.origin === 'lesson_capture') {
    await validateLessonCaptureContext({
      organizationId: data.organizationId,
      courseId: data.courseId,
      lessonId: data.lessonId
    });

    const existing = await getLessonCaptureNote({
      organizationId: data.organizationId,
      ownerId,
      lessonId: data.lessonId!
    });

    if (existing) {
      throw new AppError('A lesson note already exists for this lesson', ErrorCodes.NOTE_LESSON_CAPTURE_EXISTS, 409);
    }
  }

  const plainText = htmlToPlainText(data.content ?? '');

  const note = await createNote({
    organizationId: data.organizationId,
    ownerId,
    title: data.title,
    content: data.content ?? '',
    plainText,
    origin: data.origin,
    courseId: data.courseId ?? null,
    lessonId: data.lessonId ?? null,
    videoAnchors: data.videoAnchors ?? []
  });

  if (note.content) {
    await insertNoteVersion({
      noteId: note.id,
      oldContent: null,
      newContent: note.content,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  return getNoteById(note.id);
}

export async function updateNoteService(organizationId: string, ownerId: string, noteId: string, data: TUpdateNote) {
  const existing = await getNoteService(organizationId, ownerId, noteId);

  const nextContent = data.content ?? existing.content;
  const nextTitle = data.title ?? existing.title;
  const nextVideoAnchors = data.videoAnchors ?? existing.videoAnchors;
  const contentChanged = data.content !== undefined && data.content !== existing.content;

  const updated = await updateNote(noteId, {
    title: nextTitle,
    content: nextContent,
    plainText: htmlToPlainText(nextContent),
    videoAnchors: nextVideoAnchors,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (contentChanged) {
    await insertNoteVersion({
      noteId,
      oldContent: existing.content,
      newContent: nextContent,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  return getNoteById(noteId);
}

export async function deleteNoteService(organizationId: string, ownerId: string, noteId: string) {
  await getNoteService(organizationId, ownerId, noteId);
  await softDeleteNote(noteId);
  return { id: noteId };
}

export async function getNoteVersionHistoryService(
  organizationId: string,
  ownerId: string,
  noteId: string,
  endRange: number
) {
  await getNoteService(organizationId, ownerId, noteId);
  return getNoteVersionHistory(noteId, endRange);
}

export async function restoreNoteVersionService(
  organizationId: string,
  ownerId: string,
  noteId: string,
  versionId: number
) {
  const note = await getNoteService(organizationId, ownerId, noteId);
  const version = await getNoteVersionById(noteId, versionId);

  if (!version?.newContent) {
    throw new AppError('Note version not found', ErrorCodes.NOTE_VERSION_NOT_FOUND, 404);
  }

  const restoredContent = version.newContent;

  await updateNote(noteId, {
    content: restoredContent,
    plainText: htmlToPlainText(restoredContent),
    updatedAt: new Date().toISOString()
  });

  await insertNoteVersion({
    noteId,
    oldContent: note.content,
    newContent: restoredContent,
    changedBy: ownerId,
    changeSource: 'restore'
  });

  return getNoteById(noteId);
}

export async function getWorkspaceNoteUsageService(organizationId: string, ownerId: string) {
  const planName = await getOrganizationPlanName(organizationId);
  const used = await countWorkspaceNotesByOwner(organizationId, ownerId);
  const limit = planName === PLAN.BASIC ? BASIC_WORKSPACE_NOTE_LIMIT : null;

  return {
    planName,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0)
  };
}

export type { TNoteOrigin };
