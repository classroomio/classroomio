import { ROLE } from '@cio/utils/constants/roles';
import type { NoteListRow } from '@cio/db/queries/notes';
import type { TNoteSharePermission } from '@db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';

export function isOrgTeamRole(roleId: number): boolean {
  return roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
}

export function resolveNoteAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TNoteSharePermission | null;
}): { canRead: boolean; canWrite: boolean } {
  const { note, organizationId, userId, roleId, sharePermission = null } = params;

  if (note.organizationId !== organizationId) {
    return { canRead: false, canWrite: false };
  }

  if (note.deletedAt) {
    return { canRead: note.ownerId === userId, canWrite: note.ownerId === userId };
  }

  if (note.ownerId === userId) {
    return { canRead: true, canWrite: true };
  }

  if (note.isTemplate && note.origin === 'workspace' && isOrgTeamRole(roleId)) {
    return { canRead: true, canWrite: false };
  }

  if (note.origin === 'workspace' && note.visibility === 'team') {
    return {
      canRead: true,
      canWrite: isOrgTeamRole(roleId)
    };
  }

  if (note.origin === 'workspace' && note.visibility === 'public') {
    return { canRead: true, canWrite: false };
  }

  if (sharePermission) {
    return {
      canRead: true,
      canWrite: sharePermission === 'write'
    };
  }

  return { canRead: false, canWrite: false };
}

export function assertNoteReadAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TNoteSharePermission | null;
}): { canWrite: boolean } {
  const access = resolveNoteAccess(params);

  if (!access.canRead) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { canWrite: access.canWrite };
}

export function assertNoteWriteAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TNoteSharePermission | null;
}): void {
  const access = resolveNoteAccess(params);

  if (!access.canWrite) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }
}

/** Anyone who can read the note may comment (org team on shared notes; owner on private). Students excluded by route scope. */
export function assertNoteCommentAccess(params: {
  note: NoteListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TNoteSharePermission | null;
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
