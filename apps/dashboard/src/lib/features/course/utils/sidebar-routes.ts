import { ROUTES } from './constants';

const COURSE_ROOT = `/${ROUTES.COURSES}`;
const LESSONS_SEGMENT = `/${ROUTES.LESSONS}`;
const EXERCISES_SEGMENT = '/exercises';

function normalizePath(path = '') {
  if (!path) return '';

  if (path.startsWith('/')) {
    return path;
  }

  return `/${path}`;
}

export function getCourseBaseRoute(courseId: string) {
  return `${COURSE_ROOT}/${courseId}`;
}

export function isCourseRoute(path = '') {
  const pathname = normalizePath(path);

  if (!pathname.startsWith(`${COURSE_ROOT}/`)) {
    return false;
  }

  return pathname.split('/').filter(Boolean).length >= 2;
}

export function isCourseRouteForId(path = '', courseId = '') {
  if (!courseId) return false;

  const pathname = normalizePath(path);
  const baseRoute = getCourseBaseRoute(courseId);

  return pathname === baseRoute || pathname.startsWith(`${baseRoute}/`);
}

export function isCourseContentRoute(path = '') {
  const pathname = normalizePath(path);

  if (!isCourseRoute(pathname)) {
    return false;
  }

  const parts = pathname.split('/').filter(Boolean);
  const section = parts[2] ? `/${parts[2]}` : '';

  return section === LESSONS_SEGMENT || section === EXERCISES_SEGMENT;
}

export function isCourseContentRouteForId(path = '', courseId = '') {
  return isCourseRouteForId(path, courseId) && isCourseContentRoute(path);
}
