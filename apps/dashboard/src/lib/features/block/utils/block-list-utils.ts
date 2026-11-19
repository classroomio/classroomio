import type { TLocale } from '@cio/db/types';
import type { TPlacementMove } from '@cio/utils/validation/block';
import type { BlockRecord, BlockViewModel } from './types';

export function getBlockContent(block: BlockRecord, locale: TLocale): string {
  return block.contents[locale] ?? '';
}

export function toBlockViewModel(block: BlockRecord, locale: TLocale): BlockViewModel {
  return {
    id: block.id,
    type: block.type,
    data: block.data,
    content: getBlockContent(block, locale)
  } as BlockViewModel;
}

/**
 * The placement anchor that puts a block at `index` once `movingId` is taken out of the list.
 * @returns an empty anchor for an empty list, which appends.
 */
export function anchorForIndex(blocks: BlockRecord[], index: number, movingId?: string): Partial<TPlacementMove> {
  const others = blocks.filter((block) => block.id !== movingId);
  const next = others[index];
  if (next) return { beforePlacementId: next.placementId };

  const previous = others[index - 1] ?? others.at(-1);

  return previous ? { afterPlacementId: previous.placementId } : {};
}

export function insertAt<T>(items: T[], item: T, index: number): T[] {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);

  return next;
}

export function moveBy<T extends { id: string }>(items: T[], id: string, direction: -1 | 1): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);

  return next;
}

/**
 * Finds the one item a drag moved between two orderings of the same items.
 * @returns undefined when the orderings match.
 */
export function findMovedId<T extends { id: string }>(previous: T[], next: T[]): string | undefined {
  const firstDifference = next.findIndex((item, index) => previous[index]?.id !== item.id);
  if (firstDifference === -1) return undefined;

  const candidates = [next[firstDifference].id, previous[firstDifference]?.id].filter((id): id is string =>
    Boolean(id)
  );

  return candidates.find((id) => {
    const previousWithout = previous.filter((item) => item.id !== id).map((item) => item.id);
    const nextWithout = next.filter((item) => item.id !== id).map((item) => item.id);

    return previousWithout.join('|') === nextWithout.join('|');
  });
}
