import { ROLE } from '@cio/utils/constants/roles';
import type { NoteListRow } from '@cio/db/queries/notes';
import { AppError, ErrorCodes } from '@api/utils/errors';

export function isOrgTeamRole(roleId: number): boolean {
  return roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
}

export function assertNoteReadAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
}): { canWrite: boolean } {
  const { note, organizationId, userId, roleId } = params;

  if (note.organizationId !== organizationId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (note.isTemplate && note.origin === 'workspace' && isOrgTeamRole(roleId)) {
    return { canWrite: note.ownerId === userId };
  }

  if (note.ownerId === userId) {
    return { canWrite: true };
  }

  if (note.origin === 'workspace' && note.visibility === 'team' && isOrgTeamRole(roleId)) {
    return { canWrite: false };
  }

  throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
}

export function assertNoteWriteAccess(params: { note: NoteListRow; organizationId: string; userId: string }): void {
  const { note, organizationId, userId } = params;

  if (note.organizationId !== organizationId || note.ownerId !== userId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }
}

/** Anyone who can read the note may comment (org team on shared notes; owner on private). Students excluded by route scope. */
export function assertNoteCommentAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
}): void {
  assertNoteReadAccess(params);
}

export function assertNoteThreadResolveAccess(params: {
  note: NoteListRow;
  userId: string;
  threadCreatedBy: string | null;
}): void {
  if (params.note.ownerId === params.userId) {
    return;
  }

  if (params.threadCreatedBy === params.userId) {
    return;
  }

  throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
}

export function assertNoteCommentAuthorAccess(params: { userId: string; authorId: string | null }): void {
  if (params.authorId !== params.userId) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
}
