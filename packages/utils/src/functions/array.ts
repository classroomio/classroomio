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
