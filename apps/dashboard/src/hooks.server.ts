import { getSessionData } from '$lib/utils/services/auth/session';
import { type Handle, redirect } from '@sveltejs/kit';
import { isPublicApiRoute, isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';

export const handle: Handle = async (args) => {
  const { event } = args;

  const sessionData = await getSessionData(event.request.headers.get('cookie'));

  if (sessionData) {
    event.locals = sessionData;
  }

  // Handle API routes
  if (event.url.pathname.includes('/api')) {
    return handleAPIRoutes(args);
  }

  // Handle other routes (ui pages, etc.)
  return handlePagesRoutes(args);
};

const handlePagesRoutes: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (isPublicRoute(pathname)) {
    return resolve(event);
  }

  if (!event.locals.user) {
    return redirect(303, `/login?redirect=${pathname}`);
  }

  return resolve(event);
};

const handleAPIRoutes: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (isPublicApiRoute(pathname)) {
    return resolve(event);
  }

  if (!event.locals.user) {
    redirect(303, '/login');
  }

  return resolve(event);
};
