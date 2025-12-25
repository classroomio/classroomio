import { ONBOARDING_STEPS } from './constants';
import type { TLocale } from '@cio/db/types';

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export interface OnboardingField {
  fullname?: string;
  orgName?: string;
  siteName?: string;
  goal?: string;
  source?: string;
  locale?: TLocale;
  metadata?: Record<string, string>;
}

export interface Goal {
  label: string;
  value: string;
}
