const ROUTES = {
  COURSES: 'courses',
  LESSONS: 'lessons',
};

export function getNavItemRoute(courseId, routeId) {
  const path = `/${ROUTES.COURSES}/${courseId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}

export function getLessonsRoute(courseId, lessonId) {
  const path = getNavItemRoute(courseId, ROUTES.LESSONS);

  if (!lessonId) {
    return path;
  }

  return `${path}/${lessonId}`;
}

export function getLectureNo(index) {
  if (index < 9) {
    return `00${index}`;
  }

  return `0${index}`;
}
