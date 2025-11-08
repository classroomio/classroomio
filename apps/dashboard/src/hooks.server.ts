import type { Handle } from '@sveltejs/kit';
import { getSessionData } from '$lib/utils/services/auth/session';

const PUBLIC_ROUTES = [
  '/api/completion',
  'student_prove_payment',
  'teacher_student_buycourse',
  '/api/polar',
  '/api/lmz',
  '/api/verify'
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.includes(route));
}

export const handle: Handle = async ({ event, resolve }) => {
  console.log('handle hook called');
  const sessionToken = event.cookies.get('better-auth.session_token');
  const sessionData = await getSessionData(sessionToken);

  if (sessionData) {
    event.locals = sessionData;
  }

  const { pathname } = event.url;
  const response = await resolve(event);

  // Only validate API routes
  if (!pathname.includes('/api')) {
    return response;
  }

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  try {
    if (!event.locals.user) {
      throw new Error('Unauthenticated user');
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthenticated user') {
        return new Response(JSON.stringify({ code: 'unauthenticated', message: 'Unauthenticated user' }), {
          status: 401
        });
      }
    }
  }

  return response;
};
