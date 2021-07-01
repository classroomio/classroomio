const ROUTES = {
  COURSES: "courses",
  LECTURES: "lecture",
};

export function getNavItemRoute(courseId, routeId) {
  const path = `/${ROUTES.COURSES}/${courseId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}

export function getLectureRoute(courseId, lectureId) {
  const path = getNavItemRoute(courseId, ROUTES.LECTURES);

  if (!lectureId) {
    return path;
  }

  return `${path}/${lectureId}`;
}

export function getLectureNo(index) {
  if (index < 9) {
    return `00${index}`;
  }

  return `0${index}`;
}
