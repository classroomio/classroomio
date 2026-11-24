import type { TOnboardingTourStepId } from '@cio/utils/constants/onboarding';

export interface TourStepDefinition {
  id: TOnboardingTourStepId;
  target: string;
  advanceOnTargetClick: boolean;
}

export const TOUR_STEP_DEFINITIONS: TourStepDefinition[] = [
  { id: 'courses-list', target: '[data-testid="courses-list"]', advanceOnTargetClick: false },
  { id: 'open-course', target: '[data-testid="course-card"]', advanceOnTargetClick: true },
  { id: 'templates', target: '[data-testid="course-template-row"]', advanceOnTargetClick: false },
  { id: 'landing-page', target: '[data-testid="org-nav-landingpage"]', advanceOnTargetClick: true },
  { id: 'audience', target: '[data-testid="org-nav-audience"]', advanceOnTargetClick: true },
  { id: 'academy', target: '[data-testid="visit-org-site"]', advanceOnTargetClick: true }
];
