export const ONBOARDING_STEP_IDS = ['business', 'customise'] as const;
export type TOnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

/**
 * Position persisted on `onboarding_session.phase`. It only moves forward. `workspace` is kept for the
 * organization-creation step that now happens inside `business`; it never maps to a screen of its own.
 */
export const ONBOARDING_PHASES = ['business', 'workspace', 'customise', 'complete'] as const;
export type TOnboardingPhase = (typeof ONBOARDING_PHASES)[number];

/**
 * Screen a user resumes on. `preparing` is derived from the starter job, so it is never persisted.
 */
export const ONBOARDING_SCREENS = ['business', 'preparing', 'customise', 'complete'] as const;
export type TOnboardingScreen = (typeof ONBOARDING_SCREENS)[number];

export const ONBOARDING_COMPLETION_ROUTES = ['publish', 'skip_to_courses', 'skip_to_academy'] as const;
export type TOnboardingCompletionRoute = (typeof ONBOARDING_COMPLETION_ROUTES)[number];

export const STARTER_COURSE_SLOTS = [
  'getting-started',
  'core-workflows',
  'collaboration',
  'help-and-next-steps'
] as const;
export type TStarterCourseSlot = (typeof STARTER_COURSE_SLOTS)[number];

export const STARTER_SECTIONS_PER_COURSE = 3;
export const STARTER_LESSONS_PER_SECTION = 3;

/** Placeholder in starter titles, descriptions and lesson bodies, replaced when the course is created. */
export const STARTER_PRODUCT_PLACEHOLDER = '{Product}';

export const STARTER_COURSE_TITLES: Record<TStarterCourseSlot, string> = {
  'getting-started': `Getting Started with ${STARTER_PRODUCT_PLACEHOLDER}`,
  'core-workflows': 'Core Workflows, Step by Step',
  collaboration: 'Collaborating with Your Team',
  'help-and-next-steps': 'Getting Help and Next Steps'
};

export const STARTER_COURSE_SEED_KEY_PREFIX = 'onboarding:';

export function buildStarterCourseSeedKey(organizationId: string, slot: TStarterCourseSlot): string {
  return `${STARTER_COURSE_SEED_KEY_PREFIX}${organizationId}:${slot}`;
}

export const STARTER_JOB_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED'] as const;
export type TStarterJobStatus = (typeof STARTER_JOB_STATUSES)[number];

export const STARTER_JOB_STAGES = ['queued', 'understanding', 'drafting', 'organising', 'finishing', 'done'] as const;
export type TStarterJobStage = (typeof STARTER_JOB_STAGES)[number];

export const STARTER_JOB_MODES = ['ai', 'sample'] as const;
export type TStarterJobMode = (typeof STARTER_JOB_MODES)[number];

export const STARTER_DRAFT_ORIGINS = ['ai', 'sample'] as const;
export type TStarterDraftOrigin = (typeof STARTER_DRAFT_ORIGINS)[number];

export const STARTER_JOB_WARNINGS = ['WEBSITE_UNREADABLE', 'GENERATION_INCOMPLETE'] as const;
export type TStarterJobWarning = (typeof STARTER_JOB_WARNINGS)[number];

export const STARTER_SLOT_TIMEOUT_MS = 40_000;
export const STARTER_JOB_SERVER_BUDGET_MS = 55_000;
export const STARTER_JOB_CONTINUE_AFTER_MS = 60_000;
export const STARTER_JOB_POLL_INTERVAL_MS = 1_500;
export const STARTER_REGENERATIONS_PER_ORG = 3;

export const SITE_NAME_CHECK_DEBOUNCE_MS = 400;
export const SITE_NAME_CHECKS_PER_MINUTE = 30;

export const ONBOARDING_BRAND_PRESETS = ['blue', 'rose', 'green', 'orange', 'purple'] as const;
export type TOnboardingBrandPreset = (typeof ONBOARDING_BRAND_PRESETS)[number];
export const ONBOARDING_DEFAULT_BRAND_PRESET: TOnboardingBrandPreset = 'blue';

export const ONBOARDING_TOUR_STEP_IDS = [
  'courses-list',
  'open-course',
  'templates',
  'landing-page',
  'audience',
  'academy'
] as const;
export type TOnboardingTourStepId = (typeof ONBOARDING_TOUR_STEP_IDS)[number];

export const ONBOARDING_TOUR_STATUSES = ['pending', 'active', 'dismissed', 'completed'] as const;
export type TOnboardingTourStatus = (typeof ONBOARDING_TOUR_STATUSES)[number];

export const ONBOARDING_WELCOME_VIDEO_ID = '-nWB2wG8hOg';

export function hasReachedOnboardingPhase(current: TOnboardingPhase, target: TOnboardingPhase): boolean {
  return ONBOARDING_PHASES.indexOf(current) >= ONBOARDING_PHASES.indexOf(target);
}

export const STARTER_BANNER_PATHS: Record<TStarterCourseSlot, string> = {
  'getting-started': '/images/onboarding/starter-getting-started.svg',
  'core-workflows': '/images/onboarding/starter-core-workflows.svg',
  collaboration: '/images/onboarding/starter-collaboration.svg',
  'help-and-next-steps': '/images/onboarding/starter-help.svg'
};
