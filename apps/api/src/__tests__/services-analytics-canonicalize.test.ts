import { describe, expect, it } from 'vitest';

import { canonicalizeSpec, hashSpec } from '@api/services/analytics/canonicalize';
import { ZAnalyticsQuerySpec, type TAnalyticsQuerySpec } from '@cio/utils/validation/analytics';

const COURSE_1 = '11111111-1111-4111-8111-111111111111';
const COURSE_2 = '22222222-2222-4222-8222-222222222222';

describe('analytics canonicalize and hash', () => {
  it('trims whitespace from search', () => {
    const spec: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [],
      search: '  john doe  '
    });

    const canonical = canonicalizeSpec(spec);
    expect(canonical.search).toBe('john doe');
  });

  it('drops empty or whitespace-only search', () => {
    const spec: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [],
      search: '    '
    });

    const canonical = canonicalizeSpec(spec);
    expect(canonical.search).toBeUndefined();
  });

  it('sorts filter values when value is an array', () => {
    const spec: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'course', op: 'in', value: [COURSE_2, COURSE_1] }]
    });

    const canonical = canonicalizeSpec(spec);
    expect(canonical.filters[0].value).toEqual([COURSE_1, COURSE_2]);
  });

  it('produces identical hashes for reordered filters', () => {
    const specA: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [
        { field: 'is_overdue', op: 'is_true' },
        { field: 'course', op: 'eq', value: COURSE_1 }
      ]
    });

    const specB: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [
        { field: 'course', op: 'eq', value: COURSE_1 },
        { field: 'is_overdue', op: 'is_true' }
      ]
    });

    const hashA = hashSpec(canonicalizeSpec(specA));
    const hashB = hashSpec(canonicalizeSpec(specB));

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(32);
  });

  it('defaults a spec without a range to all time', () => {
    const spec: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }]
    });

    expect(spec.range).toBe('all');
  });

  it('hashes specs that differ only in range differently', () => {
    const allTime: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }]
    });
    const lastWeek: TAnalyticsQuerySpec = ZAnalyticsQuerySpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      range: '7d'
    });

    expect(hashSpec(canonicalizeSpec(allTime))).not.toBe(hashSpec(canonicalizeSpec(lastWeek)));
  });
});
