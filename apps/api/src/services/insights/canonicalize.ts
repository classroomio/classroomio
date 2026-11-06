import { createHash } from 'node:crypto';

import type { TInsightsQuerySpec } from '@cio/utils/validation/insights';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));

    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * Returns the spec in one canonical form, so specs that mean the same thing hash the same.
 * Keeps the order of measures, dimensions and sort, which changes the result.
 */
export function canonicalizeSpec<TSpec extends TInsightsQuerySpec>(spec: TSpec): TSpec {
  const filters = spec.filters
    .map((filter) => (Array.isArray(filter.value) ? { ...filter, value: [...filter.value].sort() } : filter))
    .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));
  const search = spec.search?.trim() || undefined;

  return { ...spec, filters, search };
}

export function hashSpec(spec: TInsightsQuerySpec): string {
  return createHash('sha256').update(stableStringify(spec)).digest('hex').slice(0, 32);
}
