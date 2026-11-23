import type { Href } from 'expo-router';

type Query = Map<string, string>;

type Route = { pattern: RegExp; href: (segments: string[], query: Query) => Href };

const SEGMENT = '([^/?#]+)';

const ROUTES: Route[] = [
  {
    pattern: new RegExp(`^/course/${SEGMENT}/lesson/${SEGMENT}$`),
    href: ([courseId = '', lessonId = '']) => ({
      pathname: '/course/[courseId]/lesson/[lessonId]',
      params: { courseId, lessonId }
    })
  },
  {
    pattern: new RegExp(`^/course/${SEGMENT}/exercise/${SEGMENT}$`),
    href: ([courseId = '', exerciseId = '']) => ({
      pathname: '/course/[courseId]/exercise/[exerciseId]',
      params: { courseId, exerciseId }
    })
  },
  {
    pattern: new RegExp(`^/course/${SEGMENT}/newsfeed/${SEGMENT}$`),
    href: ([courseId = '', postId = '']) => ({
      pathname: '/course/[courseId]/newsfeed/[postId]',
      params: { courseId, postId }
    })
  },
  {
    pattern: new RegExp(`^/course/${SEGMENT}$`),
    href: ([courseId = '']) => ({ pathname: '/course/[courseId]', params: { courseId } })
  },
  {
    pattern: new RegExp(`^/explore/${SEGMENT}$`),
    href: ([courseId = '']) => ({ pathname: '/explore/[courseId]', params: { courseId } })
  },
  {
    pattern: new RegExp(`^/(?:paths|learning-path)/${SEGMENT}$`),
    href: ([pathId = '']) => ({ pathname: '/learning/path/[pathId]', params: { pathId } })
  },
  {
    pattern: new RegExp(`^/submissions/${SEGMENT}$`),
    href: ([submissionId = '']) => ({ pathname: '/submissions/[submissionId]', params: { submissionId } })
  },
  {
    pattern: new RegExp(`^/courses/${SEGMENT}/attendance$`),
    href: ([courseId = ''], query) => ({
      pathname: '/courses/[courseId]/attendance',
      params: query.has('lessonId') ? { courseId, lessonId: query.get('lessonId') ?? '' } : { courseId }
    })
  },
  {
    pattern: new RegExp(`^/courses/${SEGMENT}/people$`),
    href: ([courseId = '']) => ({ pathname: '/courses/[courseId]/people', params: { courseId } })
  },
  {
    pattern: new RegExp(`^/courses/${SEGMENT}$`),
    href: ([courseId = '']) => ({ pathname: '/courses/[courseId]', params: { courseId } })
  },
  {
    pattern: new RegExp(`^/certificates/${SEGMENT}$`),
    href: ([courseId = '']) => ({ pathname: '/certificates/[courseId]', params: { courseId } })
  },
  { pattern: /^\/certificates$/, href: () => '/certificates' },
  { pattern: /^\/(?:learn|learning|compliance)$/, href: () => '/learning' },
  { pattern: /^\/explore$/, href: () => '/explore' },
  { pattern: /^\/goals$/, href: () => '/goals' },
  { pattern: /^\/submissions$/, href: () => '/submissions' },
  { pattern: /^\/courses$/, href: () => '/courses' },
  { pattern: /^\/people$/, href: () => '/people' },
  {
    pattern: /^\/learners$/,
    href: (_segments, query) => ({
      pathname: '/learners',
      params: query.has('filter') ? { filter: query.get('filter') ?? '' } : {}
    })
  },
  { pattern: /^\/home$/, href: () => '/home' }
];

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** The app route a notification's `deepLink` opens, or null for a path the app does not know. */
export function hrefForDeepLink(deepLink: string | null | undefined): Href | null {
  if (!deepLink) return null;

  const [beforeHash = ''] = deepLink.split('#');
  const [rawPath = '', search = ''] = beforeHash.split('?');
  const path = rawPath.replace(/\/+$/, '');
  const query: Query = new Map(
    search
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [key = '', value = ''] = pair.split('=');

        return [decodeSegment(key), decodeSegment(value.replace(/\+/g, ' '))] as const;
      })
  );

  for (const route of ROUTES) {
    const match = route.pattern.exec(path);
    if (match) return route.href(match.slice(1).map(decodeSegment), query);
  }

  return null;
}

/** Whether a notification links to the web dashboard rather than a screen in the app. */
export function isWebDeepLink(deepLink: string | null | undefined): deepLink is string {
  return Boolean(deepLink && /^https?:\/\//i.test(deepLink));
}

/** Whether tapping a notification has somewhere to go: an app screen or a web dashboard page. */
export function canOpenDeepLink(deepLink: string | null | undefined) {
  return isWebDeepLink(deepLink) || hrefForDeepLink(deepLink) !== null;
}
