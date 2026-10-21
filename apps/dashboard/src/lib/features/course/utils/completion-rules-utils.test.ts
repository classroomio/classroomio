import { describe, expect, it } from 'vitest';

import { getCompletionRulesSummary } from './completion-rules-utils';
import type { Course } from './types';

type CourseOverrides = {
  certificate?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

function buildCourse(overrides: CourseOverrides = {}): Course {
  return {
    certificate: null,
    metadata: null,
    ...overrides
  } as unknown as Course;
}

describe('getCompletionRulesSummary', () => {
  it('defaults to free progression and no deadline when nothing is stored', () => {
    expect(getCompletionRulesSummary(buildCourse())).toEqual({
      progressionMode: 'free',
      deadline: null
    });
  });

  it('summarizes stored rules', () => {
    const course = buildCourse({
      metadata: { progressionMode: 'sequential' },
      certificate: {
        deadline: '2026-12-31T17:00:00.000Z'
      }
    });

    expect(getCompletionRulesSummary(course)).toEqual({
      progressionMode: 'sequential',
      deadline: '2026-12-31T17:00:00.000Z'
    });
  });

  it('handles a missing course', () => {
    expect(getCompletionRulesSummary(null)).toEqual({
      progressionMode: 'free',
      deadline: null
    });
  });
});
