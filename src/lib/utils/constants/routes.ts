export const ROUTE = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',
  COURSES: '/courses',
  PAGES: '/pages',
  COURSE: '/course',
  LOGIN: '/login',
  SIGN_UP: '/signup',
  PROFILE: '/profile',
  PEOPLE: '/people',
  DISCUSSIONS: '/discussions',
  ASK: '/ask',
  FORGOT: '/forgot',
  RESET: '/reset'
};

export const PUBLIC_ROUTES = [
  `^${ROUTE.HOME}$`,
  ROUTE.LOGIN,
  ROUTE.SIGN_UP,
  ROUTE.FORGOT,
  ROUTE.RESET,
  `^${ROUTE.PAGES}/.*`,
  `^${ROUTE.COURSE}/.*`
];

export const ROUTES_TO_HIDE_NAV = [
  ROUTE.LOGIN,
  ROUTE.SIGN_UP,
  ROUTE.FORGOT,
  ROUTE.RESET,
  ROUTE.ONBOARDING
];
