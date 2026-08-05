/**
 * Coerces a number or numeric string to a finite number.
 * Does not coerce booleans, arrays, or other types (unlike bare `Number()`).
 * Empty, null, and invalid values return undefined.
 */
export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
