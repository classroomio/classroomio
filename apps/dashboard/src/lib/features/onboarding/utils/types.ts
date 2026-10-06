import { ONBOARDING_STEPS } from './constants';
import type { TLocale } from '@cio/db/types';

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export interface OnboardingField {
  fullname: string;
  orgName: string;
  siteName: string;
  useCases: string[];
  useCaseOther: string;
  learningMethod: string;
  learningMethodOther: string;
  companySize: string;
  jobRole: string;
  jobRoleOther: string;
  source: string;
  sourceOther: string;
  aiProvider: string;
  aiProviderOther: string;
  locale: TLocale;
}
