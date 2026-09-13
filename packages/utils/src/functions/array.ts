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
