import { ROUTES_TO_HIDE_NAV } from '$lib/utils/constants/routes';

export default (route: string): boolean => {
  return ROUTES_TO_HIDE_NAV.some((publicRoute) => {
    const regex = new RegExp(publicRoute, 'g');
    return regex.test(route);
  });
};
