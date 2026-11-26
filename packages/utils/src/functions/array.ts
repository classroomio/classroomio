/**
 * Safely normalizes a value to an array for processing
 * Useful for processing jsonb fields from database or API responses
 * @param value Value that might be an array, null, or undefined
 * @returns Array (empty if value is not an array)
 */
export function normalizeToArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Removes duplicate items from an array while preserving original order.
 * Optionally accepts a key mapper function for arrays of objects.
 *
 * @param items - Source array to deduplicate
 * @param keyFn - Optional key selector for object items
 * @returns New array with duplicate items removed
 */
export function dedupe<T>(items: T[], keyFn?: (item: T) => unknown): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  if (!keyFn) {
    return Array.from(new Set(items));
  }

  const seen = new Set<unknown>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Splits an array into consecutive slices of at most `size` items.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) {
    throw new RangeError('chunk size must be at least 1');
  }

  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }

  return chunks;
}
