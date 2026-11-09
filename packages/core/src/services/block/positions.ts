import { AppError, ErrorCodes } from '@cio/utils/errors';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

export interface PlacementPosition {
  id: string;
  position: string;
}

export interface PlacementAnchor {
  beforePlacementId?: string;
  afterPlacementId?: string;
}

function indexOfAnchor(ordered: PlacementPosition[], placementId: string): number {
  const index = ordered.findIndex((entry) => entry.id === placementId);
  if (index === -1) {
    throw new AppError('Anchor block not found in this lesson', ErrorCodes.BLOCK_PLACEMENT_NOT_FOUND, 404);
  }

  return index;
}

/**
 * Picks a position key for a new or moved placement.
 * @param ordered the lesson's placements in order, excluding any placement being moved.
 * @returns a key sorting between the anchor and its neighbour, or after the last placement when unanchored.
 * @throws AppError when the anchor is not in `ordered`.
 */
export function positionForAnchor(ordered: PlacementPosition[], anchor: PlacementAnchor): string {
  if (anchor.afterPlacementId) {
    const index = indexOfAnchor(ordered, anchor.afterPlacementId);

    return generateKeyBetween(ordered[index].position, ordered[index + 1]?.position ?? null);
  }

  if (anchor.beforePlacementId) {
    const index = indexOfAnchor(ordered, anchor.beforePlacementId);

    return generateKeyBetween(ordered[index - 1]?.position ?? null, ordered[index].position);
  }

  return generateKeyBetween(ordered[ordered.length - 1]?.position ?? null, null);
}

/**
 * Generates `count` ascending keys starting after `afterPosition`, before `beforePosition`.
 */
export function positionsAfter(afterPosition: string | null, count: number): string[] {
  const keys: string[] = [];
  let previous = afterPosition;
  for (let index = 0; index < count; index += 1) {
    const next = generateKeyBetween(previous, null);
    keys.push(next);
    previous = next;
  }

  return keys;
}

/**
 * Picks positions for new items saved in a list that also holds existing items of the same kind.
 * Each run of new items goes directly before the next existing item in submitted order, or directly
 * after the last existing item when it trails them, so the saved list keeps the submitted order.
 * @param submitted the saved list in order; `true` marks an item that already has a placement.
 * @param slots positions the existing items take, ascending, one per `true` entry.
 * @param ordered every placement position in the lesson, ascending, including `slots`.
 * @returns one position per new item, in submitted order.
 */
export function positionsForNewItems(submitted: boolean[], slots: string[], ordered: string[]): string[] {
  const keys: string[] = [];
  let existingSeen = 0;
  let pendingCount = 0;

  const flush = () => {
    if (pendingCount === 0) return;

    const nextSlot = slots[existingSeen];
    const lastSlot = slots[slots.length - 1];
    let lower: string | null;
    let upper: string | null;
    if (nextSlot !== undefined) {
      upper = nextSlot;
      lower = ordered[ordered.indexOf(nextSlot) - 1] ?? null;
    } else if (lastSlot !== undefined) {
      lower = lastSlot;
      upper = ordered[ordered.indexOf(lastSlot) + 1] ?? null;
    } else {
      lower = ordered[ordered.length - 1] ?? null;
      upper = null;
    }

    keys.push(...generateNKeysBetween(lower, upper, pendingCount));
    pendingCount = 0;
  };

  for (const isExisting of submitted) {
    if (!isExisting) {
      pendingCount += 1;
      continue;
    }

    flush();
    existingSeen += 1;
  }
  flush();

  return keys;
}
