import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_DIMENSIONS,
  ANALYTICS_FILTER_FIELDS,
  ANALYTICS_METRICS,
  ANALYTICS_SOURCES
} from '../src/constants/analytics';
import {
  ANALYTICS_DIMENSION_DESCRIPTIONS,
  ANALYTICS_FILTER_DESCRIPTIONS,
  ANALYTICS_METRIC_DESCRIPTIONS,
  ANALYTICS_SOURCE_DESCRIPTIONS
} from '../src/constants/analytics-catalog';

describe('analytics catalog descriptions', () => {
  it('gives every source a non-empty description', () => {
    expect(Object.keys(ANALYTICS_SOURCE_DESCRIPTIONS).sort()).toEqual([...ANALYTICS_SOURCES].sort());

    for (const description of Object.values(ANALYTICS_SOURCE_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });

  it('gives every metric a non-empty description', () => {
    expect(Object.keys(ANALYTICS_METRIC_DESCRIPTIONS).sort()).toEqual([...ANALYTICS_METRICS].sort());

    for (const description of Object.values(ANALYTICS_METRIC_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });

  it('gives every dimension a non-empty description', () => {
    expect(Object.keys(ANALYTICS_DIMENSION_DESCRIPTIONS).sort()).toEqual([...ANALYTICS_DIMENSIONS].sort());

    for (const description of Object.values(ANALYTICS_DIMENSION_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });

  it('gives every filter a non-empty description', () => {
    expect(Object.keys(ANALYTICS_FILTER_DESCRIPTIONS).sort()).toEqual([...ANALYTICS_FILTER_FIELDS].sort());

    for (const description of Object.values(ANALYTICS_FILTER_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });
});
