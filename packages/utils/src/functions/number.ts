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

const COMPACT_COUNT_UNITS = [
  { suffix: 'b', divisor: 1_000_000_000 },
  { suffix: 'm', divisor: 1_000_000 },
  { suffix: 'k', divisor: 1_000 }
] as const;

/**
 * Formats a whole-number count for compact UI (e.g. sidebar totals).
 * Values under 1000 stay exact; larger values use lowercase k/m/b with at most one decimal.
 */
export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  const count = Math.floor(value);
  if (count < 1000) {
    return String(count);
  }

  for (const { suffix, divisor } of COMPACT_COUNT_UNITS) {
    if (count >= divisor) {
      const compact = count / divisor;
      const rounded = Math.round(compact * 10) / 10;
      const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      return `${formatted}${suffix}`;
    }
  }

  return String(count);
}
