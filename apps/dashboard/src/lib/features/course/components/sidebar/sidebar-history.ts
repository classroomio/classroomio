import { browser } from '$app/environment';
import {
  getCourseBaseRoute,
  isCourseContentRouteForId,
  isCourseRouteForId
} from '$features/course/utils/sidebar-routes';

const STORAGE_KEY = 'course-sidebar:last-non-content-route';

let cache: Record<string, string> | null = null;

function getPathname(route: string) {
  if (!route) return '';

  const [pathWithoutHash] = route.split('#');
  const [pathWithoutQuery] = pathWithoutHash.split('?');

  if (!pathWithoutQuery) return '';

  if (pathWithoutQuery.startsWith('/')) {
    return pathWithoutQuery;
  }

  if (!browser) {
    return `/${pathWithoutQuery}`;
  }

  try {
    const parsedUrl = new URL(route, window.location.origin);
    return parsedUrl.pathname;
  } catch {
    return `/${pathWithoutQuery}`;
  }
}

function readStorage() {
  if (cache) {
    return cache;
  }

  if (!browser) {
    cache = {};
    return cache;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      cache = {};
      return cache;
    }

    const parsed = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      cache = {};
      return cache;
    }

    cache = parsed as Record<string, string>;
    return cache;
  } catch {
    cache = {};
    return cache;
  }
}

function writeStorage(state: Record<string, string>) {
  cache = state;

  if (!browser) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures (private browsing, quota limits).
  }
}

function isValidRememberedRoute(courseId: string, route: string) {
  const pathname = getPathname(route);

  if (!pathname) {
    return false;
  }

  if (!isCourseRouteForId(pathname, courseId)) {
    return false;
  }

  return !isCourseContentRouteForId(pathname, courseId);
}

export function rememberLastNonContentCourseRoute(courseId: string, route: string) {
  if (!courseId || !route) return;

  if (!isValidRememberedRoute(courseId, route)) {
    return;
  }

  const state = readStorage();
  const nextState = {
    ...state,
    [courseId]: route
  };

  writeStorage(nextState);
}

export function getLastNonContentCourseRoute(courseId: string) {
  if (!courseId) return null;

  const state = readStorage();
  const route = state[courseId];

  if (!route) {
    return null;
  }

  if (!isValidRememberedRoute(courseId, route)) {
    const nextState = { ...state };
    delete nextState[courseId];
    writeStorage(nextState);

    return null;
  }

  return route;
}

export function getCourseSidebarBackRoute(courseId: string) {
  return getLastNonContentCourseRoute(courseId) ?? getCourseBaseRoute(courseId);
}
