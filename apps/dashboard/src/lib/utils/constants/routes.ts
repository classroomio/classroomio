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
  PROFILE: '/profile',
  PEOPLE: '/people',
  DISCUSSIONS: '/discussions',
  ASK: '/ask',
  FORGOT: '/forgot',
  RESET: '/reset',
  LOGOUT: '/logout',
  AUTH_FAILED: '/auth-failed',
  VERIFY_EMAIL_ERROR: '/verify-email-error'
};

export const PUBLIC_ROUTES = [
  `^${ROUTE.HOME}$`,
  ROUTE.LOGIN,
  ROUTE.LOGOUT,
  ROUTE.SIGN_UP,
  `^${ROUTE.INVITE_TEACHER}/.*`,
  ROUTE.FORGOT,
  ROUTE.RESET,
  `^${ROUTE.PAGES}/.*`,
  `^${ROUTE.COURSE}/.*`,
  '/404',
  `^${ROUTE.VERIFY_EMAIL_ERROR}$`,
  ROUTE.AUTH_FAILED
];

export const PUBLIC_API_ROUTES = ['/api/polar', '/api/lmz', '/api/verify'];

export const ROUTES_TO_HIDE_NAV = [
  `^${ROUTE.LOGIN}$`,
  `^${ROUTE.SIGN_UP}$`,
  ROUTE.LMS_HOME,
  `^${ROUTE.INVITE_TEACHER}/.*`,
  `^/course/.*/enroll$`,
  `^${ROUTE.FORGOT}$`,
  `^${ROUTE.RESET}$`,
  `^${ROUTE.ONBOARDING}$`,
  `^${ROUTE.VERIFY_EMAIL_ERROR}$`
];
