import { isOrgManagerRole } from '$lib/utils/store/org';
import { ONBOARDING_STEPS, type OnboardingStepValue } from './constants';

export interface OnboardingAnswers {
  useCases?: string[] | null;
  learningMethod?: string | null;
  companySize?: string | null;
  jobRole?: string | null;
}

export function isOnboardingIncomplete(answers: OnboardingAnswers): boolean {
  return !answers.useCases?.length || !answers.learningMethod || !answers.companySize || !answers.jobRole;
}

export function resolveResumeStep(answers: OnboardingAnswers): OnboardingStepValue {
  if (!answers.useCases?.length) return ONBOARDING_STEPS.USE_CASES;
  if (!answers.learningMethod) return ONBOARDING_STEPS.LEARNING_METHODS;
  if (!answers.companySize) return ONBOARDING_STEPS.COMPANY_SIZE;
  if (!answers.jobRole) return ONBOARDING_STEPS.JOB_ROLE;

  return ONBOARDING_STEPS.SOURCE;
}

/**
 * True when the user already created the workspace this onboarding sets up: the current org exists and they manage it.
 */
export function hasManagedWorkspace(org: { id: string; roleId: number }): boolean {
  return !!org.id && isOrgManagerRole(org.roleId);
}
