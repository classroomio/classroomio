import { describe, expect, it } from 'vitest';
import { ONBOARDING_STEP_IDS } from '@cio/utils/constants/onboarding';
import { ONBOARDING_SCREEN_ROUTES, getOnboardingStepIndex, getOnboardingTotalSteps } from './constants';
import { ROUTE } from '$lib/utils/constants/routes';

describe('getOnboardingStepIndex', () => {
  it('numbers the steps from one in flow order', () => {
    expect(getOnboardingStepIndex(ONBOARDING_STEP_IDS[0])).toBe(1);
    expect(getOnboardingStepIndex(ONBOARDING_STEP_IDS[ONBOARDING_STEP_IDS.length - 1])).toBe(
      ONBOARDING_STEP_IDS.length
    );
  });

  it('keeps every step in ascending order', () => {
    const indices = ONBOARDING_STEP_IDS.map((step) => getOnboardingStepIndex(step));

    expect(indices).toEqual([...indices].sort((left, right) => left - right));
    expect(new Set(indices).size).toBe(indices.length);
  });
});

describe('getOnboardingTotalSteps', () => {
  it('counts every step in the flow', () => {
    expect(getOnboardingTotalSteps()).toBe(ONBOARDING_STEP_IDS.length);
  });
});

describe('ONBOARDING_SCREEN_ROUTES', () => {
  it('routes every screen inside the flow', () => {
    for (const route of Object.values(ONBOARDING_SCREEN_ROUTES)) {
      expect(route === ROUTE.ONBOARDING || route.startsWith(`${ROUTE.ONBOARDING}/`)).toBe(true);
    }
  });

  it('sends a completed flow back to the root', () => {
    expect(ONBOARDING_SCREEN_ROUTES.complete).toBe(ROUTE.ONBOARDING);
  });
});
