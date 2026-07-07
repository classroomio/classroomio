import { getSessionData } from '$lib/utils/services/auth/session';
import { getHasCioCookies } from '$lib/utils/functions/cookies';
import { applyCspExtensions } from '$lib/utils/csp';
import { proxyRequestToApi, shouldForwardToApi } from '$lib/utils/proxy-api-request';
import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { isPublicApiRoute, isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
import { ROUTE } from '$lib/utils/constants/routes';

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  const err = error as Error;
  console.error('[handleError]', {
    status,
    message,
    method: event.request.method,
    url: event.url.toString(),
    name: err?.name,
    msg: err?.message,
    stack: err?.stack
  });
};

const ANALYTICS_SESSION_COOKIE = 'cio_aid';
const ANALYTICS_SESSION_MAX_AGE = 60 * 60 * 24 * 90;

function ensureAnalyticsSessionCookie(cookies: Parameters<Handle>[0]['event']['cookies']) {
  if (cookies.get(ANALYTICS_SESSION_COOKIE)) return;

  cookies.set(ANALYTICS_SESSION_COOKIE, crypto.randomUUID(), {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: ANALYTICS_SESSION_MAX_AGE
  });
}

export const handle: Handle = async (args) => {
  const { event } = args;

  if (shouldForwardToApi(event.url.pathname)) {
    return proxyRequestToApi(event.request);
  }

  const cookieString = event.cookies.getAll().map((c) => `${c.name}=${c.value}`);
  console.log('event.cookies', cookieString);
  console.log('page path', event.url.pathname);
  const sessionData = await getSessionData(event.cookies);

  if (sessionData) {
    event.locals = sessionData;
  }

  if (!event.url.pathname.includes('/api')) {
    ensureAnalyticsSessionCookie(event.cookies);
  }

  let response: Response;

  if (event.url.pathname.includes('/api')) {
    response = await handleAPIRoutes(args);
  } else {
    response = await handlePagesRoutes(args);
  }

  // Prevent Cloudflare/CDN from caching HTML pages — stale HTML references old
  // hashed JS/CSS bundles after a deploy, causing the app to hang on deep links.
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate');
  }

  return applyCspExtensions(response);
};

const handlePagesRoutes: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const hasCioCookie = getHasCioCookies(event.cookies);

  if (isPublicRoute(pathname)) {
    return resolve(event);
  }

  if (!event?.locals?.user && !hasCioCookie) {
    console.log('no user and no cio cookie, redirecting to login');
    const shouldAddRedirectParam = !pathname.includes(ROUTE.LOGOUT);
    const fullPath = pathname + event.url.search;
    const redirectPath = shouldAddRedirectParam
      ? `${ROUTE.LOGIN}?redirect=${encodeURIComponent(fullPath)}`
      : ROUTE.LOGIN;

    return redirect(303, redirectPath);
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
