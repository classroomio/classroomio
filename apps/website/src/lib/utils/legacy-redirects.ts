const HELP_ARTICLES: Record<string, string> = {
  audience: '/help/reference/audience',
  certificates: '/help/create-and-deliver/certificates',
  community: '/help/reference/community',
  course: '/help/reference/course',
  'course-enrollment': '/help/manage-students/course-enrollment',
  'course-landingpage': '/help/publish-and-brand/course-landingpage',
  'course-progression': '/help/create-and-deliver/course-progression',
  'course-types': '/help/create-and-deliver/course-types',
  'create-exercise': '/help/create-and-deliver/create-exercise',
  'create-first-course': '/help/get-started/create-first-course',
  'custom-domain': '/help/publish-and-brand/custom-domain',
  'customize-organization': '/help/organization-and-team/customize-organization',
  'enrollment-access-control': '/help/manage-students/enrollment-access-control',
  'grade-exercise': '/help/create-and-deliver/grade-exercise',
  'invite-students': '/help/manage-students/invite-students',
  'invite-team-member': '/help/organization-and-team/invite-team-member',
  'live-class': '/help/create-and-deliver/live-class',
  'org-landing-page': '/help/publish-and-brand/org-landing-page',
  programs: '/help',
  'roles-and-permissions': '/help/organization-and-team/roles-and-permissions',
  'student-dashboard': '/help/reference/student-dashboard',
  'take-attendance': '/help/create-and-deliver/take-attendance',
  terminology: '/help/reference/glossary',
  'use-math-in-editor': '/help/create-and-deliver/use-math-in-editor',
  'what-is-classroomio': '/help/get-started/what-is-classroomio',
  'welcome-email': '/help/manage-students/welcome-email',
  'admin-dashboard': '/help/organization-and-team/admin-dashboard'
};

const EXACT_REDIRECTS: Record<string, string> = {
  '/home': '/',
  '/privacy-policy': '/privacy',
  '/tools': '/',
  '/tools/stopwatch': '/',
  '/mcp': '/docs/developers/mcp',
  '/developers': '/docs/developers',
  '/get-started/create-first-course': '/help/get-started/create-first-course',
  '/get-started/signup': '/help/get-started/signup',
  '/quickstart/signup': '/help/get-started/signup',
  '/quickstart/onboarding': '/help/get-started/onboarding',
  '/build-a-course/course-types': '/help/create-and-deliver/course-types',
  '/llms-full.txt': '/help/llms-full.txt'
};

const PREFIX_REDIRECTS: Array<[prefix: string, target: string]> = [
  ['/developers/', '/docs/developers/'],
  ['/self-hosted/', '/docs/self-hosted/'],
  ['/contributor-guides/', '/docs/contributing/'],
  ['/public-api/', 'https://api.classroomio.com/public-api/']
];

/**
 * Resolves an old or misdirected apex path to its current location.
 * @returns the redirect target, or null when the path has no legacy mapping.
 */
export function resolveLegacyRedirect(pathname: string): string | null {
  const exactTarget = EXACT_REDIRECTS[pathname];
  if (exactTarget) return exactTarget;

  const slug = pathname.slice(1);
  const articleTarget = Object.hasOwn(HELP_ARTICLES, slug) ? HELP_ARTICLES[slug] : null;
  if (articleTarget) return articleTarget;

  for (const [prefix, target] of PREFIX_REDIRECTS) {
    if (pathname.startsWith(prefix)) return target + pathname.slice(prefix.length);
  }

  return null;
}
