import { describe, expect, it } from 'vitest';

import { INSIGHTS_DIMENSIONS, INSIGHTS_METRICS, INSIGHTS_SOURCES } from '../src/constants/insights';
import {
  INSIGHTS_DIMENSION_DESCRIPTIONS,
  INSIGHTS_METRIC_DESCRIPTIONS,
  INSIGHTS_SOURCE_DESCRIPTIONS
} from '../src/constants/insights-catalog';

describe('insights catalog descriptions', () => {
  it('gives every source a non-empty description', () => {
    expect(Object.keys(INSIGHTS_SOURCE_DESCRIPTIONS).sort()).toEqual([...INSIGHTS_SOURCES].sort());

    for (const description of Object.values(INSIGHTS_SOURCE_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });

  it('gives every metric a non-empty description', () => {
    expect(Object.keys(INSIGHTS_METRIC_DESCRIPTIONS).sort()).toEqual([...INSIGHTS_METRICS].sort());

    for (const description of Object.values(INSIGHTS_METRIC_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });

  it('gives every dimension a non-empty description', () => {
    expect(Object.keys(INSIGHTS_DIMENSION_DESCRIPTIONS).sort()).toEqual([...INSIGHTS_DIMENSIONS].sort());

    for (const description of Object.values(INSIGHTS_DIMENSION_DESCRIPTIONS)) {
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.endsWith('.')).toBe(true);
    }
  });
});
