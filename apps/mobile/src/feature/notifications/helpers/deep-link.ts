import type { Href } from 'expo-router';

type Route = { pattern: RegExp; href: (segments: string[]) => Href };

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
    pattern: new RegExp(`^/community/${SEGMENT}$`),
    href: ([slug = '']) => ({ pathname: '/community/[slug]', params: { slug } })
  },
  {
    pattern: new RegExp(`^/certificates/${SEGMENT}$`),
    href: ([courseId = '']) => ({ pathname: '/certificates/[courseId]', params: { courseId } })
  },
  { pattern: /^\/certificates$/, href: () => '/certificates' },
  { pattern: /^\/compliance$/, href: () => '/compliance' },
  { pattern: /^\/community$/, href: () => '/community' },
  { pattern: /^\/learn$/, href: () => '/learn' },
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

  const path = deepLink.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? '';

  for (const route of ROUTES) {
    const match = route.pattern.exec(path);
    if (match) return route.href(match.slice(1).map(decodeSegment));
  }

  return null;
}
