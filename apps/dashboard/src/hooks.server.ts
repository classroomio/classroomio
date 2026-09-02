import { getSessionData } from '$lib/utils/services/auth/session';
import { getHasCioCookies } from '$lib/utils/functions/cookies';
import { applyCspExtensions } from '$lib/utils/csp';
import { proxyRequestToApi, shouldForwardToApi } from '$lib/utils/proxy-api-request';
import { type Handle, type HandleServerError, isRedirect, redirect } from '@sveltejs/kit';
import { isPublicApiRoute, isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
import { ROUTE } from '$lib/utils/constants/routes';
import { isCustomDomainHost } from '$lib/utils/functions/custom-domain';

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

/**
 * Returns the serialized `Set-Cookie` when a new session id was minted, so
 * redirect responses built outside `resolve` can carry it. SvelteKit only
 * applies `cookies.set` to responses that pass through `resolve`.
 */
function ensureAnalyticsSessionCookie(cookies: Parameters<Handle>[0]['event']['cookies']): string | null {
  if (cookies.get(ANALYTICS_SESSION_COOKIE)) return null;

  const sessionId = crypto.randomUUID();
  const options = {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: ANALYTICS_SESSION_MAX_AGE
  } as const;

  cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, options);

  return cookies.serialize(ANALYTICS_SESSION_COOKIE, sessionId, options);
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function isDocumentRequest(request: Request): boolean {
  const destination = request.headers.get('sec-fetch-dest');
  if (destination) return destination === 'document';

  return request.headers.get('accept')?.includes('text/html') ?? false;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Copy headers without collapsing repeated `Set-Cookie` values into one. */
function cloneResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  for (const [name, value] of source.entries()) {
    if (name === 'set-cookie') continue;

    headers.set(name, value);
  }

  const setCookies = typeof source.getSetCookie === 'function' ? source.getSetCookie() : [];
  for (const cookie of setCookies) {
    headers.append('set-cookie', cookie);
  }

  return headers;
}

/**
 * BYOD custom domains sit behind Approximated's edge, which replays a cached
 * `103 Early Hints` for any URL it has previously seen return HTML. When the
 * origin then answers that URL with a redirect, the status is flattened to
 * `200` and only the `Location` header survives. Browsers ignore `Location` on
 * a 2xx, so an empty-bodied redirect renders as a blank page.
 *
 * Give document redirects a meta-refresh body so navigation still happens if a
 * proxy rewrites the status. Meta refresh only, no inline script, so the CSP
 * applied in `applyCspExtensions` needs no nonce.
 */
function withRedirectFallbackBody(response: Response, request: Request): Response {
  if (!REDIRECT_STATUSES.has(response.status)) return response;

  const location = response.headers.get('location');
  if (!location || !isDocumentRequest(request)) return response;

  const escapedLocation = escapeHtmlAttribute(location);
  const body =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta http-equiv="refresh" content="0; url=${escapedLocation}"></head>` +
    `<body><a href="${escapedLocation}">Continue</a></body></html>`;

  const headers = cloneResponseHeaders(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.delete('content-length');

  return new Response(body, { status: response.status, statusText: response.statusText, headers });
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

  const isApiRequest = event.url.pathname.includes('/api');
  let analyticsSetCookie: string | null = null;

  if (!isApiRequest) {
    analyticsSetCookie = ensureAnalyticsSessionCookie(event.cookies);
  }

  let response: Response;

  try {
    response = isApiRequest ? await handleAPIRoutes(args) : await handlePagesRoutes(args);
  } catch (error) {
    if (!isRedirect(error)) throw error;

    response = new Response(null, {
      status: error.status,
      headers: { location: error.location }
    });

    if (analyticsSetCookie) {
      response.headers.append('set-cookie', analyticsSetCookie);
    }
  }

  response = withRedirectFallbackBody(response, event.request);

  // Prevent Cloudflare/CDN from caching HTML pages — stale HTML references old
  // hashed JS/CSS bundles after a deploy, causing the app to hang on deep links.
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate');

    // SvelteKit emits `Link: rel=preload` headers for every HTML page. On BYOD
    // domains Approximated caches those per URL and replays them as `103 Early
    // Hints`, which is what breaks a later redirect on the same URL. Dropping
    // the header stops new URLs from being poisoned; the `<head>` link tags are
    // untouched, so app-owned hosts keep header preloads.
    if (isCustomDomainHost(event.url)) {
      response.headers.delete('link');
    }
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
