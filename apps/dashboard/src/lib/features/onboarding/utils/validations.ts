import type { OnboardingField, OnboardingStep } from './types';
import { ZOnboardingStep1, ZOnboardingStep2 } from '@cio/utils/validation/onboarding';

import { ONBOARDING_STEPS } from './constants';
import { blockedSubdomain } from '@cio/utils/constants';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

export const onboardingValidation = (field: OnboardingField, step: OnboardingStep) => {
  if (step === ONBOARDING_STEPS.ORG_SETUP) {
    if (blockedSubdomain.includes(field.siteName || '')) {
      return { siteName: 'Sitename already exists.' };
    }

    const result = ZOnboardingStep1.safeParse(field);
    if (!result.success) {
      return mapZodErrorsToTranslations(result.error);
    }
  }

  if (step === ONBOARDING_STEPS.USER_METADATA) {
    const result = ZOnboardingStep2.safeParse(field);
    if (!result.success) {
      return mapZodErrorsToTranslations(result.error);
    }
  }
};
