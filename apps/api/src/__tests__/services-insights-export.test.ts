import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/utils/constants/insights', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/utils/constants/insights')>();

  return {
    ...actual,
    INSIGHTS_LIMITS: { ...actual.INSIGHTS_LIMITS, maxExportExerciseCells: 2 }
  };
});

vi.mock('@cio/db/queries/insights', () => ({
  requiresOrderedItems: vi.fn().mockReturnValue(false),
  runInsightsQuery: vi.fn()
}));

vi.mock('@api/services/insights/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/insights/structure', () => ({
  getInsightsCourseStructure: vi.fn(),
  toOrderedItems: vi.fn().mockReturnValue([])
}));

vi.mock('@api/services/insights/plan', () => ({
  resolveInsightsRange: vi.fn().mockResolvedValue('all')
}));

import { runInsightsQuery } from '@cio/db/queries/insights';
import { ZInsightsExportSpec } from '@cio/utils/validation/insights';
import { resolveAuthorizedScope } from '@api/services/insights/authorize';
import { exportInsightsStudentsForActor } from '@api/services/insights/export';
import type { InsightsActor } from '@api/services/insights/types';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const STUDENT_1 = '44444444-4444-4444-8444-444444444444';
const STUDENT_2 = '55555555-5555-4555-8555-555555555555';
const EXERCISE_1 = '66666666-6666-4666-8666-666666666666';
const EXERCISE_2 = '77777777-7777-4777-8777-777777777777';

const actor: InsightsActor = {
  profileId: '99999999-9999-4999-8999-999999999999',
  orgId: ORG_ID,
  orgRoles: { [ORG_ID]: 2 }
};

const scope = {
  orgId: ORG_ID,
  type: 'course' as const,
  id: COURSE_ID,
  courseIds: [COURSE_ID]
};

const studentSpec = ZInsightsExportSpec.parse({
  source: 'student',
  dimensions: ['student'],
  measures: [{ metric: 'name', agg: 'value' }]
});

const exerciseSpec = ZInsightsExportSpec.parse({
  source: 'assessment_result',
  dimensions: ['student', 'exercise'],
  measures: [
    { metric: 'best_score_pct', agg: 'value' },
    { metric: 'state', agg: 'value' },
    { metric: 'passed', agg: 'value' }
  ],
  filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
});

const studentRows = [
  { student_id: STUDENT_1, name__value: 'Ada' },
  { student_id: STUDENT_2, name__value: 'Grace' }
];

const exerciseRows = [
  {
    student_id: STUDENT_1,
    exercise_id: EXERCISE_1,
    best_score_pct__value: 80,
    state__value: 'graded',
    passed__value: true
  },
  {
    student_id: STUDENT_1,
    exercise_id: EXERCISE_2,
    best_score_pct__value: 55,
    state__value: 'awaiting_grade',
    passed__value: null
  },
  {
    student_id: STUDENT_2,
    exercise_id: EXERCISE_1,
    best_score_pct__value: 90,
    state__value: 'graded',
    passed__value: true
  }
];

describe('exportInsightsStudentsForActor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthorizedScope).mockResolvedValue(scope);
    vi.mocked(runInsightsQuery).mockImplementation(async (spec) => {
      if (spec.source === 'assessment_result') {
        return { columns: [], rows: exerciseRows, total: exerciseRows.length };
      }

      return { columns: [], rows: studentRows, total: 5 };
    });
  });

  it('returns only the student page when the document has no exercise columns', async () => {
    const result = await exportInsightsStudentsForActor(actor, {
      scope: { type: 'course', id: COURSE_ID },
      studentSpec
    });

    expect(result.students.rows).toHaveLength(2);
    expect(result.cells).toEqual({});
    expect(result.studentsTruncated).toBe(true);
    expect(result.exercisesTruncated).toBe(false);
    expect(runInsightsQuery).toHaveBeenCalledTimes(1);
  });

  it('narrows exercise results to the exported students and attempted cells', async () => {
    await exportInsightsStudentsForActor(actor, {
      scope: { type: 'course', id: COURSE_ID },
      studentSpec,
      exerciseSpec
    });

    const exerciseCall = vi.mocked(runInsightsQuery).mock.calls.find(([spec]) => spec.source === 'assessment_result');
    const spec = exerciseCall?.[0];

    expect(spec?.filters).toContainEqual({ field: 'is_attempted', op: 'is_true' });
    expect(spec?.filters).toContainEqual({ field: 'student', op: 'in', value: [STUDENT_1, STUDENT_2] });
    expect(spec?.limit).toBe(50_000);
  });

  it('builds compact cells and stops at the cell cap', async () => {
    const result = await exportInsightsStudentsForActor(actor, {
      scope: { type: 'course', id: COURSE_ID },
      studentSpec,
      exerciseSpec
    });

    expect(result.cells).toEqual({
      [STUDENT_1]: {
        [EXERCISE_1]: { scorePct: 80, state: 'graded', passed: true },
        [EXERCISE_2]: { scorePct: 55, state: 'awaiting_grade', passed: null }
      }
    });
    expect(result.exercisesTruncated).toBe(true);
    expect(result.cells[STUDENT_2]).toBeUndefined();
  });

  it('does not mark the exercise cells truncated when every row fits', async () => {
    vi.mocked(runInsightsQuery).mockImplementation(async (spec) => {
      if (spec.source === 'assessment_result') {
        return { columns: [], rows: exerciseRows.slice(0, 1), total: 1 };
      }

      return { columns: [], rows: studentRows, total: 2 };
    });

    const result = await exportInsightsStudentsForActor(actor, {
      scope: { type: 'course', id: COURSE_ID },
      studentSpec,
      exerciseSpec
    });

    expect(result.exercisesTruncated).toBe(false);
    expect(result.studentsTruncated).toBe(false);
    expect(result.cells[STUDENT_1]?.[EXERCISE_1]?.scorePct).toBe(80);
  });
});
