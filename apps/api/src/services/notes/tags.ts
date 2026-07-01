import { AppError, ErrorCodes } from '@api/utils/errors';
import { getNoteService } from './notes';
import { getTagsByIds } from '@cio/db/queries/tag';
import {
  getNoteTagsByNoteIdsForOrganization,
  getNoteTagsForOrganization,
  replaceNoteTagAssignments
} from '@cio/db/queries/notes';
import type { TNoteTagAssignment } from '@cio/utils/validation/notes';

function assertWorkspaceNoteTagsAllowed(note: { origin: string }) {
  if (note.origin !== 'workspace') {
    throw new AppError('Only workspace notes support tags', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

export async function getNoteTagsService(organizationId: string, ownerId: string, noteId: string) {
  const note = await getNoteService(organizationId, ownerId, noteId);
  assertWorkspaceNoteTagsAllowed(note);

  return getNoteTagsForOrganization(organizationId, noteId);
}

export async function replaceNoteTagsService(
  organizationId: string,
  ownerId: string,
  noteId: string,
  data: TNoteTagAssignment
) {
  const note = await getNoteService(organizationId, ownerId, noteId);
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
