export const blockedSubdomain = [
  'academy',
  'app',
  'apps',
  'blog',
  'build',
  'campaign',
  'church',
  'cloud',
  'community',
  'conference',
  'course',
  'courses',
  'demo',
  'dev',
  'embed',
  'embeds',
  'forum',
  'group',
  'groups',
  'help',
  'launch',
  'launchweek',
  'mobile',
  'play',
  'prod',
  'production',
  'schools',
  'stage',
  'staging',
  'support',
  'teacher',
  'teachers',
  'tech',
  'training',
  'www',
  'mail',
  'api',
  'admin'
];

export const LANDING_PAGE_THEMES = [
  'minimal',
  'bold',
  'classic',
  'saas',
  'tech',
  'studio',
  'corporate',
  'terminal',
  'editorial',
  'vibrant',
  'quartz'
] as const;
export type TLandingPageTheme = (typeof LANDING_PAGE_THEMES)[number];

export const DEFAULT_LANDING_PAGE_THEME: TLandingPageTheme = 'quartz';

/**
 * Landing page themes available on the free plan.
 *
 * Shared so the dashboard picker and the `updateOrg` entitlement gate cannot drift: the API
 * rejects any theme outside this set for `PLAN.BASIC`, and a mismatch would 403 free
 * organisations when they save landing-page settings.
 */
export const FREE_LANDING_PAGE_THEMES: readonly string[] = ['quartz'];

export function isFreeLandingPageTheme(theme: string): boolean {
  return FREE_LANDING_PAGE_THEMES.includes(theme);
}

/** What the LMS uses for any `organization.customization` key the organization never saved. */
export const DEFAULT_ORG_CUSTOMIZATION = {
  apps: { comments: true },
  course: { grading: true, newsfeed: true },
  dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' },
  auth: { backgroundImage: '' }
};

export const ORG_THEME_NAMES: readonly string[] = [
  'default',
  'blue',
  'green',
  'amber',
  'rose',
  'purple',
  'orange',
  'teal',
  'mono',
  'scaled',
  'red',
  'yellow',
  'violet'
];
