export const ONBOARDING_STEPS = {
  ORG_SETUP: 1,
  USER_METADATA: 2
} as const;

export const DROPDOWN_ITEMS = [
  { id: 'de', text: 'German' },
  { id: 'en', text: 'English' },
  { id: 'es', text: 'Spanish' },
  { id: 'fr', text: 'French' },
  { id: 'hi', text: 'Hindi' },
  { id: 'pl', text: 'Polish' },
  { id: 'pt', text: 'Portuguese' },
  { id: 'ru', text: 'Russian' },
  { id: 'tr', text: 'Turkish' },
  { id: 'vi', text: 'Vietnamese' },
  { id: 'da', text: 'Danish' }
];

export const GOALS = [
  {
    label: 'onboarding.employees',
    value: 'employees'
  },
  {
    label: 'onboarding.customers',
    value: 'customers'
  },
  {
    label: 'onboarding.expanding',
    value: 'expanding-platform'
  }
];

export const AI_SOURCE_VALUE = 'ai';

export const AI_PROVIDERS = [
  {
    label: 'onboarding.ai_providers.chatgpt',
    value: 'ChatGPT'
  },
  {
    label: 'onboarding.ai_providers.claude',
    value: 'Claude'
  },
  {
    label: 'onboarding.ai_providers.gemini',
    value: 'Gemini'
  },
  {
    label: 'onboarding.ai_providers.grok',
    value: 'Grok'
  },
  {
    label: 'onboarding.ai_providers.perplexity',
    value: 'Perplexity'
  }
];

export const SOURCES = [
  {
    label: 'onboarding.articles',
    value: 'articles'
  },
  {
    label: 'onboarding.ai',
    value: AI_SOURCE_VALUE
  },
  {
    label: 'onboarding.search',
    value: 'search-engine'
  },
  {
    label: 'onboarding.social',
    value: 'social-media'
  },
  {
    label: 'onboarding.friends',
    value: 'friends-family'
  }
];
