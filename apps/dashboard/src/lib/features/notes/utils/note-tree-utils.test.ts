import { describe, expect, it } from 'vitest';
import { buildNoteTree, partitionSidebarSections } from './note-tree-utils';
import type { SidebarNoteItem } from '../api/notes.svelte';

function makeNote(overrides: Partial<SidebarNoteItem> = {}): SidebarNoteItem {
  return {
    id: 'note-1',
    organizationId: 'org-1',
    ownerId: 'user-1',
    title: 'Note',
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
    isFavorited: false,
    canWrite: true,
    tags: [],
    ...overrides
  };
}

describe('partitionSidebarSections', () => {
  it('places favorited notes only in favorites', () => {
    const notes = [
      makeNote({ id: 'fav-1', isFavorited: true }),
      makeNote({ id: 'private-1', ownerId: 'user-1' })
    ];

    const sections = partitionSidebarSections(notes, 'user-1');

    expect(sections.favorites.map((note) => note.id)).toEqual(['fav-1']);
    expect(sections.private.map((note) => note.id)).toEqual(['private-1']);
  });

  it('routes team notes to workspace', () => {
    const notes = [makeNote({ id: 'team-1', visibility: 'team', ownerId: 'user-1' })];
    const sections = partitionSidebarSections(notes, 'user-1');

    expect(sections.workspace.map((note) => note.id)).toEqual(['team-1']);
    expect(sections.private).toEqual([]);
  });
});

describe('buildNoteTree', () => {
  it('nests children under parents', () => {
    const notes = [
      makeNote({ id: 'parent', parentId: null, sortOrder: 0 }),
      makeNote({ id: 'child', parentId: 'parent', sortOrder: 1, title: 'Child' })
    ];

    const tree = buildNoteTree(notes);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe('parent');
    expect(tree[0]?.children[0]?.id).toBe('child');
  });
});
