function sortedJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : 1))
        .map(([key, entry]) => [key, sortedJson(entry)])
    );
  }

  return value;
}

/** Compares two JSON values ignoring key order and `undefined` entries. */
export function isSameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortedJson(left)) === JSON.stringify(sortedJson(right));
}
