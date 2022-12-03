export const ROUTE = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/onboarding',
  COURSES: '/courses',
  LOGIN: '/login',
  SIGN_UP: '/signup',
  PROFILE: '/profile',
  PEOPLE: '/people',
  DISCUSSIONS: '/discussions',
  ASK: '/ask',
  FORGOT: '/forgot',
  RESET: '/reset',
};

export const PUBLIC_ROUTES = [
  ROUTE.HOME,
  ROUTE.LOGIN,
  ROUTE.SIGN_UP,
  ROUTE.FORGOT,
  ROUTE.RESET,
];

export const ROUTES_TO_HIDE_NAV = [...PUBLIC_ROUTES, ROUTE.ONBOARDING];
