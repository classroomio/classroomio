import { generateKeyBetween } from 'fractional-indexing';

/**
 * Returns a placement key sorting between two neighbours; null means the open end of the list.
 */
export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}
