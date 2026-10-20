export type SubmissionFilterOption = {
  id: string;
  label: string;
  count: number;
};

export type BoardFilterTarget = {
  studentId: string;
  exerciseId: string;
};

/**
 * Returns whether an item passes the board filters.
 * An empty id list leaves that dimension unfiltered. Both dimensions must match.
 */
export function matchesBoardFilters(
  item: BoardFilterTarget,
  studentIds: ReadonlySet<string>,
  exerciseIds: ReadonlySet<string>
): boolean {
  const studentMatches = studentIds.size === 0 || (item.studentId !== '' && studentIds.has(item.studentId));
  const exerciseMatches = exerciseIds.size === 0 || exerciseIds.has(item.exerciseId);
  return studentMatches && exerciseMatches;
}

export function parseIdParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function sameIdSelection(ids: Iterable<string>, raw: string | null): boolean {
  const fromUrl = parseIdParam(raw);
  const selected = [...ids];
  if (fromUrl.length !== selected.length) return false;

  const urlIds = new Set(fromUrl);
  return selected.every((id) => urlIds.has(id));
}

export function formatIdParam(ids: Iterable<string>): string {
  return [...ids].sort().join(',');
}

/**
 * Rebuilds a column after a drag on the filtered view.
 * Hidden items stay in place. Visible items that left are removed.
 * Items that arrived are appended after the reordered visible slots.
 */
export function mergeColumnItems<T extends { id: string }>(
  previousItems: T[],
  nextVisibleItems: T[],
  isVisible: (item: T) => boolean
): T[] {
  const visibleItems = nextVisibleItems.filter((item) => isVisible(item));
  const hiddenItems = previousItems.filter((item) => !isVisible(item));
  if (hiddenItems.length === 0) return visibleItems;

  const nextVisibleIds = new Set(visibleItems.map((item) => item.id));
  const merged: T[] = [];
  let hiddenIndex = 0;
  let visibleIndex = 0;

  for (const item of previousItems) {
    if (!isVisible(item)) {
      merged.push(hiddenItems[hiddenIndex]);
      hiddenIndex += 1;
      continue;
    }

    if (!nextVisibleIds.has(item.id)) continue;

    const nextItem = visibleItems[visibleIndex];
    if (!nextItem) continue;

    merged.push(nextItem);
    visibleIndex += 1;
  }

  while (visibleIndex < visibleItems.length) {
    merged.push(visibleItems[visibleIndex]);
    visibleIndex += 1;
  }

  return merged;
}
