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
  { id: 'vi', text: 'Vietnamese' },
  { id: 'da', text: 'Danish' }
];

export const GOALS = [
  {
    label: 'onboarding.sell',
    value: 'sell-online'
  },
  {
    label: 'onboarding.teach',
    value: 'teach-online'
  },
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

export const SOURCES = [
  {
    label: 'onboarding.articles',
    value: 'articles'
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
