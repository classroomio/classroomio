import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countWorkspaceNotesByOwner,
  createNote,
  getLessonCaptureNote,
  getNoteById,
  getNoteVersionById,
  getNoteVersionHistory,
  insertNoteVersion,
  listAccessibleNotes,
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
  TUpdateNote,
  TUpdateNoteVisibility
} from '@cio/utils/validation/notes';
import type { TPlan } from '@db/types';
import { assertNoteReadAccess, assertNoteWriteAccess, isOrgTeamRole } from './access';

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

async function getReadableNote(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const access = assertNoteReadAccess({ note, organizationId, userId, roleId });

  return { note, canWrite: access.canWrite };
}

async function validateLessonCaptureContext(params: { organizationId: string; courseId?: string; lessonId?: string }) {
  if (!params.lessonId || !params.courseId) {
    throw new AppError('Lesson capture notes require courseId and lessonId', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await verifyLessonBelongsToCourse(params.lessonId, params.courseId);
}

export async function listNotesService(organizationId: string, userId: string, roleId: number, query: TListNotesQuery) {
  const notes = await listAccessibleNotes({
    organizationId,
    userId,
    isTeamMember: isOrgTeamRole(roleId),
    scope: query.scope,
    origin: query.origin,
    courseId: query.courseId,
    lessonId: query.lessonId,
    search: query.search,
    tagId: query.tagId
  });

  const { attachTagsToNotes } = await import('./tags');

  return attachTagsToNotes(organizationId, notes);
}

export async function getNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note, canWrite } = await getReadableNote(organizationId, userId, roleId, noteId);

  return { ...note, canWrite };
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
    visibility: 'private',
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

  return { ...(await getNoteById(note.id))!, canWrite: true };
}

export async function updateNoteService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TUpdateNote
) {
  const { note: existing } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note: existing, organizationId, userId });

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
      changedBy: userId,
      changeSource: 'manual'
    });
  }

  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function updateNoteVisibilityService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TUpdateNoteVisibility
) {
  const { note: existing } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note: existing, organizationId, userId });

  if (existing.origin !== 'workspace') {
    throw new AppError('Only workspace notes can be shared', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Only team members can share notes', ErrorCodes.UNAUTHORIZED, 403);
  }

  const updated = await updateNote(noteId, {
    visibility: data.visibility,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function deleteNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId });
  await softDeleteNote(noteId);
  return { id: noteId };
}

export async function getNoteVersionHistoryService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  endRange: number
) {
  await getReadableNote(organizationId, userId, roleId, noteId);
  return getNoteVersionHistory(noteId, endRange);
}

export async function restoreNoteVersionService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  versionId: number
) {
  const { note } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId });

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
    changedBy: userId,
    changeSource: 'restore'
  });

  const updatedNote = await getNoteById(noteId);

  if (!updatedNote) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...updatedNote, canWrite: true };
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

export type { TNoteOrigin, NoteListRow };
