export const ROUTE = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LMS_HOME: '/home',
  ONBOARDING: '/onboarding',
  COURSES: '/courses',
  PAGES: '/pages',
  COURSE: '/course',
  LOGIN: '/login',
  SIGN_UP: '/signup',
  INVITE_TEACHER: '/invite/t',
  INVITE_STUDENT: '/invite/s',
  PROFILE: '/profile',
  PEOPLE: '/people',
  DISCUSSIONS: '/discussions',
  ASK: '/ask',
  FORGOT: '/forgot',
  RESET: '/reset',
  LOGOUT: '/logout'
};

export const PUBLIC_ROUTES = [
  // `^${ROUTE.HOME}$`,
  ROUTE.LOGIN,
  ROUTE.SIGN_UP,
  `^${ROUTE.INVITE_TEACHER}/.*`,
  ROUTE.FORGOT,
  ROUTE.RESET,
  `^${ROUTE.PAGES}/.*`,
  `^${ROUTE.COURSE}/.*`,
  '/404'
];

export const PUBLIC_API_ROUTES = [
  '/api/completion',
  'student_prove_payment',
  'teacher_student_buycourse',
  '/api/polar',
  '/api/lmz',
  '/api/verify'
];

export const ROUTES_TO_HIDE_NAV = [
  `^${ROUTE.LOGIN}$`,
  `^${ROUTE.SIGN_UP}$`,
  ROUTE.LMS_HOME,
  `^${ROUTE.INVITE_TEACHER}/.*`,
  `^${ROUTE.INVITE_STUDENT}/.*`,
  `^${ROUTE.FORGOT}$`,
  `^${ROUTE.RESET}$`,
  `^${ROUTE.ONBOARDING}$`
];
