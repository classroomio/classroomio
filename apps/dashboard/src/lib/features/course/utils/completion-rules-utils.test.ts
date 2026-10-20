import { describe, expect, it } from 'vitest';

import { getCompletionRulesSummary } from './completion-rules-utils';
import type { Course } from './types';

type CourseOverrides = {
  certificate?: Record<string, unknown> | null;
};

function buildCourse(overrides: CourseOverrides = {}): Course {
  return {
    certificate: null,
    ...overrides
  } as unknown as Course;
}

describe('getCompletionRulesSummary', () => {
  it('fills in the API defaults when nothing is stored', () => {
    expect(getCompletionRulesSummary(buildCourse())).toEqual({
      threshold: 100,
      deadline: null
    });
  });

  it('summarizes stored rules', () => {
    const course = buildCourse({
      certificate: {
        threshold: 80,
        deadline: '2026-12-31T17:00:00.000Z'
      }
    });

    expect(getCompletionRulesSummary(course)).toEqual({
      threshold: 80,
      deadline: '2026-12-31T17:00:00.000Z'
    });
  });

  it('handles a missing course', () => {
    expect(getCompletionRulesSummary(null)).toEqual({
      threshold: 100,
      deadline: null
    });
  });
});
