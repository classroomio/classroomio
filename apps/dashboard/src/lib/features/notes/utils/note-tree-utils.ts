import type { SidebarNoteItem } from '../api/notes.svelte';

export type NoteTreeNode = SidebarNoteItem & {
  children: NoteTreeNode[];
};

export type SidebarSections = {
  favorites: SidebarNoteItem[];
  private: SidebarNoteItem[];
  shared: SidebarNoteItem[];
  workspace: SidebarNoteItem[];
};

export function getExpandedStorageKey(orgId: string) {
  return `notes-sidebar-expanded:${orgId}`;
}

export function readExpandedNoteIds(orgId: string): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(getExpandedStorageKey(orgId));
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];

    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function writeExpandedNoteIds(orgId: string, ids: Set<string>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getExpandedStorageKey(orgId), JSON.stringify(Array.from(ids)));
}

export function partitionSidebarSections(notes: SidebarNoteItem[], userId: string): SidebarSections {
  const favorites = notes
    .filter((note) => note.isFavorited)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  const favoriteIds = new Set(favorites.map((note) => note.id));

  const privateNotes = notes.filter(
    (note) => note.ownerId === userId && note.visibility !== 'team' && !favoriteIds.has(note.id)
  );

  const shared = notes.filter(
    (note) => note.ownerId !== userId && note.visibility !== 'team' && !favoriteIds.has(note.id)
  );

  const workspace = notes.filter((note) => note.visibility === 'team' && !favoriteIds.has(note.id));

  return { favorites, private: privateNotes, shared, workspace };
}

function sortTreeNodes(nodes: NoteTreeNode[]) {
  nodes.sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );

  for (const node of nodes) {
    sortTreeNodes(node.children);
  }
}

export function buildNoteTree(flat: SidebarNoteItem[]): NoteTreeNode[] {
  const nodes = new Map<string, NoteTreeNode>();

  for (const note of flat) {
    nodes.set(note.id, { ...note, children: [] });
  }

  const roots: NoteTreeNode[] = [];

  for (const note of flat) {
    const node = nodes.get(note.id);

    if (!node) {
      continue;
    }

    if (note.parentId && nodes.has(note.parentId)) {
      nodes.get(note.parentId)!.children.push(node);
      continue;
    }

    if (!note.parentId) {
      roots.push(node);
    }
  }

  sortTreeNodes(roots);

  return roots;
}
