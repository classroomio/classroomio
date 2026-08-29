import type { Handle, RequestEvent } from '@sveltejs/kit';

const DOCS_ORIGIN = 'https://cio-docs.digdippa.workers.dev';
const HELP_ORIGIN = 'https://cio-help.digdippa.workers.dev';

function proxy(origin: string, pathname: string, event: RequestEvent) {
  const upstream = new URL(pathname + event.url.search, origin);

  const headers = new Headers(event.request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', event.url.host);
  headers.set('x-forwarded-proto', 'https');

  const hasBody = event.request.method !== 'GET' && event.request.method !== 'HEAD';

  return fetch(upstream, {
    method: event.request.method,
    headers,
    body: hasBody ? event.request.body : undefined,
    redirect: 'manual'
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    return proxy(DOCS_ORIGIN, pathname, event);
  }

  if (pathname === '/help' || pathname.startsWith('/help/')) {
    return proxy(HELP_ORIGIN, pathname, event);
  }

  return resolve(event);
};
