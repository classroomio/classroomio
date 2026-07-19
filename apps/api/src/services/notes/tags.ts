import { AppError, ErrorCodes } from '@api/utils/errors';
import { getTagsByIds } from '@cio/db/queries/tag';
import {
  getNoteTagsByNoteIdsForOrganization,
  getNoteTagsForOrganization,
  replaceNoteTagAssignments
} from '@cio/db/queries/notes';
import { getNoteSharePermission } from '@cio/db/queries/notes/share';
import type { TNoteTagAssignment } from '@cio/utils/validation/notes';
import { assertNoteReadAccess, assertNoteWriteAccess } from './access';
import { getNoteById } from '@cio/db/queries/notes';

function assertWorkspaceNoteTagsAllowed(note: { origin: string }) {
  if (note.origin !== 'workspace') {
    throw new AppError('Only workspace notes support tags', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

export async function getNoteTagsService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(noteId, userId);
  assertNoteReadAccess({ note, organizationId, userId, roleId, sharePermission });
  assertWorkspaceNoteTagsAllowed(note);

  return getNoteTagsForOrganization(organizationId, noteId);
}

export async function replaceNoteTagsService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TNoteTagAssignment
) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(noteId, userId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });
  assertWorkspaceNoteTagsAllowed(note);

  const uniqueTagIds = Array.from(new Set(data.tagIds));

  if (uniqueTagIds.length > 0) {
    const validTags = await getTagsByIds(organizationId, uniqueTagIds);
    if (validTags.length !== uniqueTagIds.length) {
      throw new AppError('One or more tags are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'tagIds');
    }
  }

  await replaceNoteTagAssignments(noteId, uniqueTagIds);

  return getNoteTagsForOrganization(organizationId, noteId);
}

export async function attachTagsToNotes<T extends { id: string }>(
  organizationId: string,
  notes: T[]
): Promise<Array<T & { tags: Awaited<ReturnType<typeof getNoteTagsByNoteIdsForOrganization>>[string] }>> {
  const tagsByNoteId = await getNoteTagsByNoteIdsForOrganization(
    organizationId,
    notes.map((note) => note.id)
  );

  return notes.map((note) => ({
    ...note,
    tags: tagsByNoteId[note.id] ?? []
  }));
}
