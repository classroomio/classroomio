import { PUBLIC_ROUTES } from '../../constants/routes';

export default (route) => {
  return PUBLIC_ROUTES.some((publicRoute) => {
    const regex = new RegExp(publicRoute, 'g');
    return regex.test(route);
  });
};
