import { AppError, ErrorCodes } from '@api/utils/errors';
import { getTagsByIds } from '@cio/db/queries/tag';
import {
  getNoteTagsByNoteIdsForOrganization,
  getNoteTagsForOrganization,
  replaceNoteTagAssignments
} from '@cio/db/queries/docs';
import { getNoteSharePermission } from '@cio/db/queries/docs/share';
import type { TDocTagAssignment } from '@cio/utils/validation/docs';
import { assertNoteReadAccess, assertNoteWriteAccess } from './access';
import { getDocById } from '@cio/db/queries/docs';

function assertWorkspaceNoteTagsAllowed(note: { origin: string }) {
  if (note.origin !== 'organization') {
    throw new AppError('Only workspace notes support tags', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

export async function getNoteTagsService(organizationId: string, userId: string, roleId: number, docId: string) {
  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(docId, userId);
  assertNoteReadAccess({ note, organizationId, userId, roleId, sharePermission });
  assertWorkspaceNoteTagsAllowed(note);

  return getNoteTagsForOrganization(organizationId, docId);
}

export async function replaceNoteTagsService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  data: TDocTagAssignment
) {
  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(docId, userId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });
  assertWorkspaceNoteTagsAllowed(note);

  const uniqueTagIds = Array.from(new Set(data.tagIds));

  if (uniqueTagIds.length > 0) {
    const validTags = await getTagsByIds(organizationId, uniqueTagIds);
    if (validTags.length !== uniqueTagIds.length) {
      throw new AppError('One or more tags are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'tagIds');
    }
  }

  await replaceNoteTagAssignments(docId, uniqueTagIds);

  return getNoteTagsForOrganization(organizationId, docId);
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
