import type { OnboardingField, OnboardingStep } from './types';
import { ZOnboardingCreateOrg, ZOnboardingUpdateMetadata } from '@cio/utils/validation/onboarding';

import { QUESTION_STEP_FIELDS } from './constants';
import { blockedSubdomain } from '@cio/utils/constants';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

export function validateOrgSetup(field: OnboardingField) {
  if (blockedSubdomain.includes(field.siteName || '')) {
    return { siteName: 'Sitename already exists.' };
  }

  const result = ZOnboardingCreateOrg.safeParse(field);
  if (!result.success) {
    return mapZodErrorsToTranslations(result.error);
  }
}

export function validateMetadata(field: OnboardingField) {
  const result = ZOnboardingUpdateMetadata.safeParse(field);
  if (!result.success) {
    return mapZodErrorsToTranslations(result.error);
  }
}

export function validateQuestionStep(field: OnboardingField, step: OnboardingStep) {
  const result = ZOnboardingUpdateMetadata.safeParse(field);
  if (result.success) return;

  const errors = mapZodErrorsToTranslations(result.error);
  const stepFields = QUESTION_STEP_FIELDS[step as keyof typeof QUESTION_STEP_FIELDS] ?? [];

  const stepErrors: Record<string, string> = {};
  for (const key of stepFields) {
    if (errors[key]) stepErrors[key] = errors[key];
  }

  if (Object.keys(stepErrors).length > 0) {
    return stepErrors;
  }
}
