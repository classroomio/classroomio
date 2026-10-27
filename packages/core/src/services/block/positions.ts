import { AppError, ErrorCodes } from '@cio/utils/errors';
import { generateKeyBetween } from 'fractional-indexing';

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
