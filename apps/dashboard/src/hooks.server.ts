import type { Handle } from '@sveltejs/kit';
import { validateUser } from '$lib/utils/services/middlewares';

const PUBLIC_ROUTES = [
  '/api/completion',
  '/api/verify',
  'student_prove_payment',
  'teacher_student_buycourse',
  '/api/polar',
  '/api/lmz'
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.includes(route));
}

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  const { pathname } = event.url;

  // Only validate API routes
  if (!pathname.includes('/api')) {
    return response;
  }

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  const accessToken = event.request.headers.get('Authorization')!;

  const user = await validateUser(accessToken);

  response.headers.set('user_id', `${user.id}`);

  return response;
};
