import { describe, expect, it } from 'vitest';
import { ONBOARDING_TOUR_STEP_IDS } from '@cio/utils/constants/onboarding';
import { TOUR_STEP_DEFINITIONS } from './tour-steps';

describe('TOUR_STEP_DEFINITIONS', () => {
  it('offers every tour step exactly once', () => {
    const ids = TOUR_STEP_DEFINITIONS.map((step) => step.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...ONBOARDING_TOUR_STEP_IDS].sort());
  });

  it('anchors every step to a stable test id', () => {
    for (const step of TOUR_STEP_DEFINITIONS) {
      expect(step.target).toMatch(/^\[data-testid="[a-z0-9-]+"\]$/);
    }
  });

  it('keeps the targets unique', () => {
    const targets = TOUR_STEP_DEFINITIONS.map((step) => step.target);

    expect(new Set(targets).size).toBe(targets.length);
  });

  it('only advances on click for steps that navigate', () => {
    const advancing = TOUR_STEP_DEFINITIONS.filter((step) => step.advanceOnTargetClick).map((step) => step.id);

    expect(advancing).toEqual(['open-course', 'landing-page', 'audience', 'academy']);
  });
});
