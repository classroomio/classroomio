import { PUBLIC_API_ROUTES, PUBLIC_ROUTES } from '$lib/utils/constants/routes';

export const isPublicRoute = (route = '') => {
  return PUBLIC_ROUTES.some((publicRoute) => {
    const regex = new RegExp(publicRoute, 'g');
    return regex.test(route);
  });
};

export default isPublicRoute;

export const isPublicApiRoute = (pathname = '') => {
  return PUBLIC_API_ROUTES.some((route) => pathname.includes(route));
};
