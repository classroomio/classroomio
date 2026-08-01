import { ROLE } from '@cio/utils/constants/roles';
import type { DocListRow } from '@cio/db/queries/docs';
import type { TDocSharePermission } from '@db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';

export function isOrgTeamRole(roleId: number): boolean {
  return roleId === ROLE.ADMIN || roleId === ROLE.TUTOR;
}

export function resolveNoteAccess(params: {
  note: DocListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TDocSharePermission | null;
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

  if (note.isTemplate && note.origin === 'organization' && isOrgTeamRole(roleId)) {
    return { canRead: true, canWrite: false };
  }

  if (note.origin === 'organization' && note.visibility === 'team') {
    return {
      canRead: true,
      canWrite: isOrgTeamRole(roleId)
    };
  }

  if (note.origin === 'organization' && note.visibility === 'public') {
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
  note: DocListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TDocSharePermission | null;
}): { canWrite: boolean } {
  const access = resolveNoteAccess(params);

  if (!access.canRead) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { canWrite: access.canWrite };
}

export function assertNoteWriteAccess(params: {
  note: DocListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TDocSharePermission | null;
}): void {
  const access = resolveNoteAccess(params);

  if (!access.canWrite) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }
}

/** Anyone who can read the note may comment (org team on shared notes; owner on private). Students excluded by route scope. */
export function assertNoteCommentAccess(params: {
  note: DocListRow;
  organizationId: string;
  userId: string;
  roleId: number;
  sharePermission?: TDocSharePermission | null;
}): void {
  assertNoteReadAccess(params);
}

export function assertNoteThreadResolveAccess(params: {
  note: DocListRow;
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
