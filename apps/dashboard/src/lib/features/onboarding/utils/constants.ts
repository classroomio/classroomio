import {
  ONBOARDING_AI_PROVIDERS,
  ONBOARDING_COMPANY_SIZES,
  ONBOARDING_JOB_ROLES,
  ONBOARDING_LEARNING_METHODS,
  ONBOARDING_SOURCES,
  ONBOARDING_USE_CASES
} from '@cio/utils/validation/onboarding';

export const ONBOARDING_STEPS = {
  ORG_SETUP: 'org-setup',
  USE_CASES: 'use-cases',
  LEARNING_METHODS: 'learning-methods',
  COMPANY_SIZE: 'company-size',
  JOB_ROLE: 'job-role',
  SOURCE: 'source'
} as const;

export type OnboardingStepValue = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export const QUESTION_STEPS = [
  ONBOARDING_STEPS.USE_CASES,
  ONBOARDING_STEPS.LEARNING_METHODS,
  ONBOARDING_STEPS.COMPANY_SIZE,
  ONBOARDING_STEPS.JOB_ROLE,
  ONBOARDING_STEPS.SOURCE
] as const;

export const ONBOARDING_STEP_ORDER: OnboardingStepValue[] = [ONBOARDING_STEPS.ORG_SETUP, ...QUESTION_STEPS];

export const OTHER_VALUE = 'other';
export const TESTIMONIALS_WIDGET_ID = 'd25263b3-f71c-4d2a-bb4f-4c627c2257af';
export const AI_SOURCE_VALUE = 'ai';

const USE_CASE_LABELS: Record<(typeof ONBOARDING_USE_CASES)[number], string> = {
  'customer-training': 'onboarding.use_cases.customer_training',
  'customer-certification': 'onboarding.use_cases.customer_certification',
  'partner-training': 'onboarding.use_cases.partner_training',
  'team-training': 'onboarding.use_cases.team_training',
  'sell-courses': 'onboarding.use_cases.sell_courses',
  other: 'onboarding.other'
};

const LEARNING_METHOD_LABELS: Record<(typeof ONBOARDING_LEARNING_METHODS)[number], string> = {
  'self-serve': 'onboarding.learning_methods.self_serve',
  'live-onboarding': 'onboarding.learning_methods.live_onboarding',
  'help-docs': 'onboarding.learning_methods.help_docs',
  'no-training': 'onboarding.learning_methods.no_training',
  other: 'onboarding.other'
};

const COMPANY_SIZE_LABELS: Record<(typeof ONBOARDING_COMPANY_SIZES)[number], string> = {
  solo: 'onboarding.company_sizes.solo.label',
  '2-9': 'onboarding.company_sizes.small.label',
  '10-50': 'onboarding.company_sizes.medium.label',
  '51-200': 'onboarding.company_sizes.large.label',
  '200-plus': 'onboarding.company_sizes.enterprise.label'
};

const COMPANY_SIZE_DESCRIPTIONS: Record<(typeof ONBOARDING_COMPANY_SIZES)[number], string> = {
  solo: 'onboarding.company_sizes.solo.description',
  '2-9': 'onboarding.company_sizes.small.description',
  '10-50': 'onboarding.company_sizes.medium.description',
  '51-200': 'onboarding.company_sizes.large.description',
  '200-plus': 'onboarding.company_sizes.enterprise.description'
};

const JOB_ROLE_LABELS: Record<(typeof ONBOARDING_JOB_ROLES)[number], string> = {
  founder: 'onboarding.job_roles.founder',
  'product-ops': 'onboarding.job_roles.product_ops',
  'cs-education': 'onboarding.job_roles.cs_education',
  developer: 'onboarding.job_roles.developer',
  other: 'onboarding.other'
};

const SOURCE_LABELS: Record<(typeof ONBOARDING_SOURCES)[number], string> = {
  blog: 'onboarding.sources.blog',
  ai: 'onboarding.sources.ai',
  'search-engine': 'onboarding.sources.search_engine',
  github: 'onboarding.sources.github',
  youtube: 'onboarding.sources.youtube',
  'social-media': 'onboarding.sources.social_media',
  'product-hunt': 'onboarding.sources.product_hunt',
  'friends-family': 'onboarding.sources.friends_family',
  other: 'onboarding.other'
};

const AI_PROVIDER_LABELS: Record<(typeof ONBOARDING_AI_PROVIDERS)[number], string> = {
  chatgpt: 'onboarding.ai_providers.chatgpt',
  claude: 'onboarding.ai_providers.claude',
  gemini: 'onboarding.ai_providers.gemini',
  grok: 'onboarding.ai_providers.grok',
  perplexity: 'onboarding.ai_providers.perplexity',
  other: 'onboarding.other'
};

export const USE_CASES = ONBOARDING_USE_CASES.map((value) => ({ value, label: USE_CASE_LABELS[value] }));
export const LEARNING_METHODS = ONBOARDING_LEARNING_METHODS.map((value) => ({
  value,
  label: LEARNING_METHOD_LABELS[value]
}));
export const COMPANY_SIZES = ONBOARDING_COMPANY_SIZES.map((value) => ({
  value,
  label: COMPANY_SIZE_LABELS[value],
  description: COMPANY_SIZE_DESCRIPTIONS[value]
}));
export const JOB_ROLES = ONBOARDING_JOB_ROLES.map((value) => ({ value, label: JOB_ROLE_LABELS[value] }));
export const SOURCES = ONBOARDING_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] }));
export const AI_PROVIDERS = ONBOARDING_AI_PROVIDERS.map((value) => ({ value, label: AI_PROVIDER_LABELS[value] }));

export const QUESTION_STEP_LABELS: Record<(typeof QUESTION_STEPS)[number], string> = {
  [ONBOARDING_STEPS.USE_CASES]: 'onboarding.step_labels.use_cases',
  [ONBOARDING_STEPS.LEARNING_METHODS]: 'onboarding.step_labels.learning_methods',
  [ONBOARDING_STEPS.COMPANY_SIZE]: 'onboarding.step_labels.company_size',
  [ONBOARDING_STEPS.JOB_ROLE]: 'onboarding.step_labels.job_role',
  [ONBOARDING_STEPS.SOURCE]: 'onboarding.step_labels.source'
};

export const QUESTION_STEP_CONTENT: Record<(typeof QUESTION_STEPS)[number], { title: string; subtitle: string }> = {
  [ONBOARDING_STEPS.USE_CASES]: {
    title: 'onboarding.use_cases.label',
    subtitle: 'onboarding.use_cases.subtitle'
  },
  [ONBOARDING_STEPS.LEARNING_METHODS]: {
    title: 'onboarding.learning_methods.label',
    subtitle: 'onboarding.learning_methods.subtitle'
  },
  [ONBOARDING_STEPS.COMPANY_SIZE]: {
    title: 'onboarding.company_sizes.label',
    subtitle: 'onboarding.company_sizes.subtitle'
  },
  [ONBOARDING_STEPS.JOB_ROLE]: {
    title: 'onboarding.job_roles.label',
    subtitle: 'onboarding.job_roles.subtitle'
  },
  [ONBOARDING_STEPS.SOURCE]: {
    title: 'onboarding.sources.label',
    subtitle: 'onboarding.sources.subtitle'
  }
};

export const QUESTION_STEP_FIELDS: Record<(typeof QUESTION_STEPS)[number], string[]> = {
  [ONBOARDING_STEPS.USE_CASES]: ['useCases', 'useCaseOther'],
  [ONBOARDING_STEPS.LEARNING_METHODS]: ['learningMethod', 'learningMethodOther'],
  [ONBOARDING_STEPS.COMPANY_SIZE]: ['companySize'],
  [ONBOARDING_STEPS.JOB_ROLE]: ['jobRole', 'jobRoleOther'],
  [ONBOARDING_STEPS.SOURCE]: ['source', 'sourceOther', 'aiProvider', 'aiProviderOther']
};

export function getQuestionIndex(step: OnboardingStepValue): number {
  return QUESTION_STEPS.indexOf(step as (typeof QUESTION_STEPS)[number]) + 1;
}

export function getNextStep(step: OnboardingStepValue): OnboardingStepValue {
  const index = ONBOARDING_STEP_ORDER.indexOf(step);
  return ONBOARDING_STEP_ORDER[Math.min(index + 1, ONBOARDING_STEP_ORDER.length - 1)];
}

export function getPreviousStep(step: OnboardingStepValue): OnboardingStepValue {
  const index = ONBOARDING_STEP_ORDER.indexOf(step);
  return ONBOARDING_STEP_ORDER[Math.max(index - 1, 0)];
}
