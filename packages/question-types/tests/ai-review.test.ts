import { describe, expect, it } from 'vitest';

import {
  getRubricMaxPoints,
  getRubricVersion,
  isAiGradingEnabled,
  isBulkAcceptable,
  normaliseAiReview,
  readMarkingRubric
} from '../src/ai-review';

const settings = {
  aiGrading: true,
  rubric: {
    steps: [
      { id: 's1', description: 'Sets up the equation', points: 1 },
      { id: 's2', description: 'Isolates x', points: 1.5 },
      { id: 'bad', description: '', points: 2 }
    ]
  }
};
const context = { model: 'test-model', reviewedAt: '2026-11-15T10:00:00.000Z', maxPoints: 2.5 };

describe('marking rubric', () => {
  it('reads valid steps and totals their points', () => {
    const rubric = readMarkingRubric(settings);

    expect(rubric.steps.map((step) => step.id)).toEqual(['s1', 's2']);
    expect(getRubricMaxPoints(rubric)).toBe(2.5);
  });

  it('keeps a step whose text is still empty when the editor asks for it', () => {
    const rubric = readMarkingRubric(settings, { keepBlankSteps: true });

    expect(rubric.steps.map((step) => step.id)).toEqual(['s1', 's2', 'bad']);
  });

  it('is off unless enabled and has steps', () => {
    expect(isAiGradingEnabled(settings)).toBe(true);
    expect(isAiGradingEnabled({ ...settings, aiGrading: false })).toBe(false);
    expect(isAiGradingEnabled({ aiGrading: true })).toBe(false);
  });

  it('changes the version when the rubric changes', () => {
    const rubric = readMarkingRubric(settings);
    const edited = { steps: [{ ...rubric.steps[0], points: 2 }, rubric.steps[1]] };

    expect(getRubricVersion(rubric)).toBe(getRubricVersion(readMarkingRubric(settings)));
    expect(getRubricVersion(edited)).not.toBe(getRubricVersion(rubric));
  });
});

describe('normaliseAiReview', () => {
  const rubric = readMarkingRubric(settings);

  it('clamps marks to each step, recomputes the total and drops an unknown first wrong step', () => {
    const review = normaliseAiReview(
      {
        stepMarks: [
          { stepId: 's1', awarded: 5 },
          { stepId: 's2', awarded: -1, comment: ' dropped a sign ' }
        ],
        firstWrongStep: 'nope',
        comment: ' Good start. ',
        confidence: 1.4
      },
      rubric,
      context
    );

    expect(review.stepMarks).toEqual([
      { stepId: 's1', awarded: 1, max: 1 },
      { stepId: 's2', awarded: 0, max: 1.5, comment: 'dropped a sign' }
    ]);
    expect(review.suggestedPoints).toBe(1);
    expect(review.firstWrongStep).toBeNull();
    expect(review.confidence).toBe(1);
    expect(review.comment).toBe('Good start.');
    expect(review.rubricVersion).toBe(getRubricVersion(rubric));
  });

  it('marks a missing step zero', () => {
    const review = normaliseAiReview(
      { stepMarks: [{ stepId: 's1', awarded: 1 }], firstWrongStep: 's2', comment: '', confidence: 0.9 },
      rubric,
      context
    );

    expect(review.stepMarks[1].awarded).toBe(0);
    expect(review.firstWrongStep).toBe('s2');
  });
});

describe('isBulkAcceptable', () => {
  const rubric = readMarkingRubric(settings);
  const make = (confidence: number) =>
    normaliseAiReview({ stepMarks: [], firstWrongStep: null, comment: '', confidence }, rubric, context);

  it('accepts only confident, undecided suggestions', () => {
    expect(isBulkAcceptable(make(0.9))).toBe(true);
    expect(isBulkAcceptable(make(0.6))).toBe(false);
    expect(isBulkAcceptable({ ...make(0.95), decision: { status: 'rejected', decidedAt: 'x', decidedBy: 'y' } })).toBe(
      false
    );
    expect(isBulkAcceptable(undefined)).toBe(false);
  });
});
