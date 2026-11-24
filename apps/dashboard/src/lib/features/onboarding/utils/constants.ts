import {
  ONBOARDING_AI_PROVIDERS,
  ONBOARDING_COMPANY_SIZES,
  ONBOARDING_CONTEXT_MODES,
  ONBOARDING_JOB_ROLES,
  ONBOARDING_JOB_ROLE_OPTIONS,
  ONBOARDING_LEARNING_METHODS,
  ONBOARDING_SOURCES,
  ONBOARDING_USE_CASES,
  type TOnboardingContextMode,
  type TOnboardingFirstOutcome
} from '@cio/utils/validation/onboarding';
import { ONBOARDING_STEP_IDS, type TOnboardingScreen, type TOnboardingStepId } from '@cio/utils/constants/onboarding';
import { ROUTE } from '$lib/utils/constants/routes';

export const OTHER_VALUE = 'other';
export const AI_SOURCE_VALUE = 'ai';
export const TESTIMONIALS_WIDGET_ID = 'd25263b3-f71c-4d2a-bb4f-4c627c2257af';

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
  'customer-success': 'onboarding.v2.business.roles.customer_success',
  'customer-education': 'onboarding.v2.business.roles.customer_education',
  product: 'onboarding.v2.business.roles.product',
  marketing: 'onboarding.v2.business.roles.marketing',
  support: 'onboarding.v2.business.roles.support',
  operations: 'onboarding.v2.business.roles.operations',
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

export const ONBOARDING_SCREEN_ROUTES: Record<TOnboardingScreen, string> = {
  business: ROUTE.ONBOARDING_BUSINESS,
  preparing: ROUTE.ONBOARDING_PREPARING,
  customise: ROUTE.ONBOARDING_CUSTOMISE,
  complete: ROUTE.ONBOARDING
};

export const ONBOARDING_STEP_LABELS: Record<TOnboardingStepId, string> = {
  business: 'onboarding.v2.steps.business',
  customise: 'onboarding.v2.steps.customise'
};

export const ONBOARDING_FIRST_OUTCOME_OPTIONS: Array<{
  value: TOnboardingFirstOutcome;
  label: string;
  hint: string;
}> = [
  {
    value: 'onboard-customers',
    label: 'onboarding.v2.business.outcomes.onboard_customers.label',
    hint: 'onboarding.v2.business.outcomes.onboard_customers.hint'
  },
  {
    value: 'explain-product',
    label: 'onboarding.v2.business.outcomes.explain_product.label',
    hint: 'onboarding.v2.business.outcomes.explain_product.hint'
  },
  {
    value: 'increase-adoption',
    label: 'onboarding.v2.business.outcomes.increase_adoption.label',
    hint: 'onboarding.v2.business.outcomes.increase_adoption.hint'
  },
  {
    value: 'cut-tickets',
    label: 'onboarding.v2.business.outcomes.cut_tickets.label',
    hint: 'onboarding.v2.business.outcomes.cut_tickets.hint'
  }
];

export const ONBOARDING_CONTEXT_MODE_OPTIONS: Array<{ value: TOnboardingContextMode; label: string }> = [
  { value: 'website', label: 'onboarding.v2.business.context.website' },
  { value: 'description', label: 'onboarding.v2.business.context.description' }
];

export const ONBOARDING_JOB_ROLE_OPTION_LABELS: Record<(typeof ONBOARDING_JOB_ROLE_OPTIONS)[number], string> = {
  founder: 'onboarding.v2.business.roles.founder',
  'customer-success': 'onboarding.v2.business.roles.customer_success',
  'customer-education': 'onboarding.v2.business.roles.customer_education',
  product: 'onboarding.v2.business.roles.product',
  marketing: 'onboarding.v2.business.roles.marketing',
  support: 'onboarding.v2.business.roles.support',
  operations: 'onboarding.v2.business.roles.operations',
  other: 'onboarding.v2.business.roles.other'
};

export const ONBOARDING_PRIMARY_JOB_ROLES = ONBOARDING_JOB_ROLE_OPTIONS.filter((role) => role !== 'other');

export const ONBOARDING_CONTEXT_MODES_LIST = ONBOARDING_CONTEXT_MODES;

export const ONBOARDING_ADVANCE_DELAY_MS = 300;
export const ONBOARDING_DRAFT_SAVE_DEBOUNCE_MS = 400;
export const ONBOARDING_DRAFT_FLUSH_DEBOUNCE_MS = 1000;
export const ONBOARDING_TITLE_SAVE_DEBOUNCE_MS = 600;

export const ONBOARDING_FIRST_OUTCOME_TEMPLATE: Record<TOnboardingFirstOutcome, string> = {
  'onboard-customers': 'product_onboarding',
  'explain-product': 'support_product_training',
  'increase-adoption': 'feature_adoption',
  'cut-tickets': 'support_product_training'
};

export function getOnboardingStepIndex(stepId: TOnboardingStepId): number {
  return ONBOARDING_STEP_IDS.indexOf(stepId) + 1;
}

export function getOnboardingTotalSteps(): number {
  return ONBOARDING_STEP_IDS.length;
}
