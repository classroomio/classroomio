import { describe, expect, it } from 'vitest';
import { ROLE } from '@cio/utils/constants/roles';
import type { NoteListRow } from '@cio/db/queries/notes';
import { resolveNoteAccess } from '@api/services/notes/access';

function makeNote(overrides: Partial<NoteListRow> = {}): NoteListRow {
  return {
    id: 'note-1',
    organizationId: 'org-1',
    ownerId: 'owner-1',
    title: 'Test note',
    content: '',
    plainText: '',
    origin: 'workspace',
    visibility: 'private',
    slug: null,
    isPinned: false,
    isTemplate: false,
    courseId: null,
    lessonId: null,
    videoAnchors: [],
    convertedCourseId: null,
    parentId: null,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    courseTitle: null,
    lessonTitle: null,
    ownerFullname: 'Owner',
    ...overrides
  };
}

describe('resolveNoteAccess', () => {
  it('allows owners to read and write', () => {
    const note = makeNote({ ownerId: 'user-1' });

    expect(
      resolveNoteAccess({
        note,
        organizationId: 'org-1',
        userId: 'user-1',
        roleId: ROLE.STUDENT
      })
    ).toEqual({ canRead: true, canWrite: true });
  });

  it('allows admins to write team notes they do not own', () => {
    const note = makeNote({ ownerId: 'owner-1', visibility: 'team' });

    expect(
      resolveNoteAccess({
        note,
        organizationId: 'org-1',
        userId: 'admin-1',
        roleId: ROLE.ADMIN
      })
    ).toEqual({ canRead: true, canWrite: true });
  });

  it('allows students to read but not write team notes', () => {
    const note = makeNote({ ownerId: 'owner-1', visibility: 'team' });

    expect(
      resolveNoteAccess({
        note,
        organizationId: 'org-1',
        userId: 'student-1',
        roleId: ROLE.STUDENT
      })
    ).toEqual({ canRead: true, canWrite: false });
  });

  it('allows share write grants for non-owners', () => {
    const note = makeNote({ ownerId: 'owner-1', visibility: 'private' });

    expect(
      resolveNoteAccess({
        note,
        organizationId: 'org-1',
        userId: 'collaborator-1',
        roleId: ROLE.STUDENT,
        sharePermission: 'write'
      })
    ).toEqual({ canRead: true, canWrite: true });
  });

  it('denies access for unrelated users on private notes', () => {
    const note = makeNote({ ownerId: 'owner-1', visibility: 'private' });

    expect(
      resolveNoteAccess({
        note,
        organizationId: 'org-1',
        userId: 'stranger-1',
        roleId: ROLE.STUDENT
      })
    ).toEqual({ canRead: false, canWrite: false });
  });
});
